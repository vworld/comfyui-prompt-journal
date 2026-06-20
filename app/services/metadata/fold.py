"""
fold.py

A graph evaluator for ComfyUI's "prompt" (API-format) execution graph that
goes beyond simple link-following: it understands a handful of "wiring"
node patterns that real-world workflows use heavily (especially ones built
with the frontend's subgraph + "convert widget to input" features) and
folds them down to actual literal values:

  - Primitive* nodes (PrimitiveInt/Float/Boolean/String/StringMultiline,
    and bare INT/FLOAT/BOOLEAN/STRING reroute-style nodes) fold to their
    `value` (or equivalent) input.
  - Reroute-style nodes (exactly one meaningful input) fold to that input.
  - Switch-style nodes (a boolean/condition input plus on_true/on_false,
    or true/false) fold to whichever branch the condition selects --
    *if* the condition itself folds to a literal. This matters a lot:
    workflows frequently wire up a LoRA-loaded model on one branch and a
    plain model on the other, gated by a "Enable LoRA?" boolean. Only one
    branch is actually used per run.
  - Math-expression nodes (anything with an `expression` string input and
    one or more `values.<name>` inputs -- e.g. ComfyMathExpression) fold
    via a restricted arithmetic evaluator, when all operands are literal.

Two entry points matter:
  - fold_value(node_id, input_name)  -> literal value, or a NodeRef if it
    bottoms out at a "real" (non-foldable) node.
  - live_node_ids(root_ids)          -> the set of node ids that actually
    participate in producing the given root/output nodes, correctly
    pruning the *unselected* branch of any switch.
"""

from __future__ import annotations

import ast
import math
import operator
import re
from dataclasses import dataclass, field
from typing import Any

PRIMITIVE_CLASS_TYPES = {
    "PrimitiveInt", "PrimitiveFloat", "PrimitiveBoolean",
    "PrimitiveString", "PrimitiveStringMultiline",
    "INT", "FLOAT", "BOOLEAN", "STRING",
}
PRIMITIVE_VALUE_KEYS = ("value", "string", "text", "Text")

SWITCH_CONDITION_KEYS = ("switch", "boolean", "condition", "select", "select_value")
SWITCH_TRUE_KEYS = ("on_true", "true", "if_true", "value_true")
SWITCH_FALSE_KEYS = ("on_false", "false", "if_false", "value_false")

REROUTE_CLASS_TYPES = {"Reroute", "ReroutePrimitive"}

_MATH_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod, ast.Pow: operator.pow,
    ast.USub: operator.neg, ast.UAdd: operator.pos,
}
_MATH_FUNCS = {
    "floor": math.floor, "ceil": math.ceil, "round": round,
    "abs": abs, "min": min, "max": max, "sqrt": math.sqrt,
}


class NodeRef:
    """A pointer to a node that did NOT fold down to a literal -- i.e. it's
    a 'real' node (loader, sampler, image source, etc.), not wiring."""

    def __init__(self, node_id: str, class_type: str | None, title: str | None):
        self.node_id = node_id
        self.class_type = class_type
        self.title = title

    def __repr__(self):
        return f"NodeRef({self.node_id}, {self.class_type!r})"

    def to_dict(self):
        return {"_ref": self.node_id, "class_type": self.class_type, "title": self.title}


class AmbiguousBranch:
    """A switch whose condition could not be resolved to a literal -- both
    branches are reported since we genuinely don't know which was used."""

    def __init__(self, node_id: str, branches: dict[str, Any]):
        self.node_id = node_id
        self.branches = branches

    def to_dict(self):
        return {"_ambiguous_switch": self.node_id, "branches": self.branches}


def safe_eval_math(expr: str, variables: dict[str, float]) -> float | int | None:
    """Restricted arithmetic evaluator: + - * / // % ** , unary +/-, and a
    small whitelist of functions (floor/ceil/round/abs/min/max/sqrt).
    Returns None if the expression uses anything outside that whitelist."""
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError:
        return None

    def ev(node):
        if isinstance(node, ast.Expression):
            return ev(node.body)
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Name):
            if node.id in variables:
                return variables[node.id]
            raise ValueError(f"unknown variable {node.id}")
        if isinstance(node, ast.BinOp) and type(node.op) in _MATH_OPS:
            return _MATH_OPS[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _MATH_OPS:
            return _MATH_OPS[type(node.op)](ev(node.operand))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in _MATH_FUNCS:
            args = [ev(a) for a in node.args]
            return _MATH_FUNCS[node.func.id](*args)
        raise ValueError(f"disallowed expression node: {ast.dump(node)}")

    try:
        return ev(tree)
    except Exception:
        return None


@dataclass
class GraphEvaluator:
    nodes: dict[str, dict]
    _node_ids: set = field(init=False)
    _fold_cache: dict = field(default_factory=dict, init=False)

    def __post_init__(self):
        self._node_ids = set(self.nodes.keys())

    # ---------- basics ----------

    def get(self, node_id: str) -> dict | None:
        return self.nodes.get(str(node_id))

    def class_type(self, node_id: str) -> str | None:
        n = self.get(node_id)
        return n.get("class_type") if n else None

    def title(self, node_id: str) -> str | None:
        n = self.get(node_id)
        if not n:
            return None
        return (n.get("_meta") or {}).get("title") or n.get("class_type")

    def is_link(self, value: Any) -> bool:
        return isinstance(value, list) and len(value) == 2 and isinstance(value[1], int) and str(value[0]) in self._node_ids

    # ---------- constant folding ----------

    def fold_value(self, node_id: str, input_name: str, _depth: int = 0):
        node = self.get(node_id)
        if node is None or _depth > 60:
            return None
        val = (node.get("inputs") or {}).get(input_name)
        if val is None:
            return None
        if self.is_link(val):
            return self._fold_link(str(val[0]), val[1], _depth + 1)
        return val  # literal already

    def _fold_link(self, src_id: str, slot: int, _depth: int):
        node = self.get(src_id)
        if node is None:
            return NodeRef(src_id, None, None)
        ct = node.get("class_type", "")
        inputs = node.get("inputs") or {}

        # 1. Primitive passthrough
        if ct in PRIMITIVE_CLASS_TYPES:
            for k in PRIMITIVE_VALUE_KEYS:
                if k in inputs:
                    v = inputs[k]
                    if self.is_link(v):
                        return self._fold_link(str(v[0]), v[1], _depth + 1)
                    return v
            return NodeRef(src_id, ct, self.title(src_id))

        # 2. Switch
        if self._looks_like_switch(inputs):
            branch = self._eval_switch(src_id, inputs, _depth)
            if branch is not None:
                return branch

        # 3. Math expression
        if "expression" in inputs and any(k.startswith("values.") for k in inputs):
            result = self._eval_math_node(inputs, _depth)
            if result is not None:
                return result

        # 4. Reroute (single non-trivial input, passthrough)
        if ct in REROUTE_CLASS_TYPES:
            real_inputs = {k: v for k, v in inputs.items()}
            if len(real_inputs) == 1:
                only_key = next(iter(real_inputs))
                v = real_inputs[only_key]
                if self.is_link(v):
                    return self._fold_link(str(v[0]), v[1], _depth + 1)
                return v

        # Bottom of the foldable chain -- this is a "real" node.
        return NodeRef(src_id, ct, self.title(src_id))

    def _looks_like_switch(self, inputs: dict) -> bool:
        has_cond = any(k in inputs for k in SWITCH_CONDITION_KEYS)
        has_true = any(k in inputs for k in SWITCH_TRUE_KEYS)
        has_false = any(k in inputs for k in SWITCH_FALSE_KEYS)
        return has_cond and has_true and has_false

    def _eval_switch(self, node_id: str, inputs: dict, _depth: int):
        cond_key = next((k for k in SWITCH_CONDITION_KEYS if k in inputs), None)
        true_key = next((k for k in SWITCH_TRUE_KEYS if k in inputs), None)
        false_key = next((k for k in SWITCH_FALSE_KEYS if k in inputs), None)

        cond_val = inputs[cond_key]
        if self.is_link(cond_val):
            cond_val = self._fold_link(str(cond_val[0]), cond_val[1], _depth + 1)

        if isinstance(cond_val, bool):
            chosen_key = true_key if cond_val else false_key
        elif isinstance(cond_val, (int, float)):
            chosen_key = true_key if cond_val else false_key
        else:
            # condition didn't fold to a literal -- genuinely ambiguous
            true_v = inputs[true_key]
            false_v = inputs[false_key]
            return AmbiguousBranch(node_id, {
                "on_true": self._resolve_for_display(true_v, _depth),
                "on_false": self._resolve_for_display(false_v, _depth),
            })

        chosen_val = inputs[chosen_key]
        if self.is_link(chosen_val):
            return self._fold_link(str(chosen_val[0]), chosen_val[1], _depth + 1)
        return chosen_val

    def _resolve_for_display(self, val, _depth):
        if self.is_link(val):
            return self._fold_link(str(val[0]), val[1], _depth + 1)
        return val

    def _eval_math_node(self, inputs: dict, _depth: int):
        expr = inputs.get("expression")
        if not isinstance(expr, str):
            return None
        variables = {}
        for k, v in inputs.items():
            if not k.startswith("values."):
                continue
            var_name = k.split(".", 1)[1]
            if self.is_link(v):
                resolved = self._fold_link(str(v[0]), v[1], _depth + 1)
            else:
                resolved = v
            if isinstance(resolved, NodeRef) or isinstance(resolved, AmbiguousBranch):
                return None  # can't evaluate, an operand isn't literal
            variables[var_name] = resolved
        result = safe_eval_math(expr, variables)
        return result

    # ---------- live-node-set traversal (switch-aware) ----------

    def live_node_ids(self, root_ids: list[str]) -> set[str]:
        """BFS backward from the given output node ids through all input
        links, EXCEPT for switch nodes: only the selected branch's source
        node is traversed into, so unused alternatives (e.g. a bypassed
        LoRA branch) are correctly excluded."""
        seen: set[str] = set()
        stack = [str(r) for r in root_ids]
        while stack:
            nid = stack.pop()
            if nid in seen or nid not in self._node_ids:
                continue
            seen.add(nid)
            node = self.get(nid)
            inputs = node.get("inputs") or {}

            if self._looks_like_switch(inputs):
                cond_key = next((k for k in SWITCH_CONDITION_KEYS if k in inputs), None)
                true_key = next((k for k in SWITCH_TRUE_KEYS if k in inputs), None)
                false_key = next((k for k in SWITCH_FALSE_KEYS if k in inputs), None)
                cond_val = inputs[cond_key]
                if self.is_link(cond_val):
                    stack.append(str(cond_val[0]))  # condition source is always live
                    folded_cond = self.fold_value(nid, cond_key)
                else:
                    folded_cond = cond_val

                chosen_key = None
                if isinstance(folded_cond, (bool, int, float)) and not isinstance(folded_cond, NodeRef):
                    chosen_key = true_key if folded_cond else false_key

                if chosen_key:
                    chosen_val = inputs[chosen_key]
                    if self.is_link(chosen_val):
                        stack.append(str(chosen_val[0]))
                    # NOTE: the other branch is deliberately NOT pushed --
                    # it's wiring that exists in the graph but isn't live.
                else:
                    # ambiguous: can't tell which branch ran, include both
                    # rather than silently dropping a potentially-live model
                    for k in (true_key, false_key):
                        v = inputs.get(k)
                        if self.is_link(v):
                            stack.append(str(v[0]))
                continue

            for val in inputs.values():
                if self.is_link(val):
                    stack.append(str(val[0]))
                elif isinstance(val, list):
                    for item in val:
                        if self.is_link(item):
                            stack.append(str(item[0]))
        return seen
