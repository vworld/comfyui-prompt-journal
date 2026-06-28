# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUnknownParameterType=false
# pyright: reportUnknownLambdaType=false
# pyright: reportMissingTypeArgument=false
# pyright: reportOptionalMemberAccess=false


"""
semantic.py

Maps a ComfyUI 'prompt' graph (+ companion 'workflow' blob + actual media
probe data) onto the target schema:

  workflow_name, workflow_id, workflow_type, prompt, negative_prompt,
  all_prompts, requested_width/height, output_width/height, fps,
  frame_count, duration_seconds, seed, sampler, scheduler, steps, cfg,
  input_assets, primary_model, models

Every extraction here is heuristic-but-evidence-based: the heuristics were
derived from inspecting real Flux2/Wan2.2/LTX-2.3 workflow exports, not
guessed from docs (ComfyUI doesn't have authoritative schema docs). Each
function documents the rule it applies so you can retune it as you feed it
more workflow varieties.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from .fold import AmbiguousBranch, GraphEvaluator, NodeRef

if TYPE_CHECKING:
    from app.schemas.types.metadata import (
        FrameCountInfo,
        InputAssetInfo,
        JSONDict,
        MediaProbe,
        ModelUsedInfo,
        PromptUsed,
        RequestedDimensions,
        SamplingParams,
        StrengthInfo,
        WorkflowTypeInfo,
    )


# ---------------------------------------------------------------------------
# Pattern tables -- the parts most likely to need extending as you encounter
# new custom node packs. Keep these in one place.
# ---------------------------------------------------------------------------

OUTPUT_NODE_PATTERNS = {
    "image": re.compile(
        r"^(SaveImage|SaveImageWebsocket|PreviewImage|SaveAnimatedPNG|SaveAnimatedWEBP)$"
    ),
    "video": re.compile(
        r"(SaveVideo|VHS_VideoCombine|VHS_SaveVideo|CreateVideo)$", re.I
    ),
    "audio": re.compile(r"(SaveAudio)$", re.I),
}

SAMPLER_NODE_PATTERN = re.compile(
    r"^(KSampler|KSamplerAdvanced|SamplerCustom|SamplerCustomAdvanced)$"
)
TEXT_ENCODE_PATTERN = re.compile(r"TextEncode\b", re.I)
ASSET_SOURCE_PATTERN = re.compile(r"^Load(Image|Audio|Video)|LoadVideo", re.I)

MODEL_ROLE_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"lora", re.I), "lora"),
    (re.compile(r"controlnet", re.I), "controlnet"),
    (re.compile(r"ipadapter", re.I), "ipadapter"),
    (re.compile(r"motion|animatediff", re.I), "motion_model"),
    (re.compile(r"upscal", re.I), "latent_upscaler"),
    (re.compile(r"vae", re.I), "vae"),
    (re.compile(r"clip|text_?encoder", re.I), "text_encoder"),
    (
        re.compile(r"checkpoint|unet|diffusionmodel|gguf", re.I),
        "primary_generation_model",
    ),
]

# Priority order matters: first matching pattern wins (most specific first).
# Word boundaries (\b) matter here: e.g. a slot named "video_latent" must
# NOT match the "video" role just because it contains that substring.
ASSET_ROLE_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bfirst.?frame\b|\bstart.?image\b", re.I), "first_frame"),
    (re.compile(r"\blast.?frame\b|\bend.?image\b", re.I), "last_frame"),
    (
        re.compile(r"\breference\b|\bref.?image\b|\bstyle.?image\b", re.I),
        "reference_image",
    ),
    (re.compile(r"\bdepth\b", re.I), "depth_map"),
    (re.compile(r"\bcontrol\b", re.I), "control_image"),
    (re.compile(r"\bmask\b", re.I), "mask"),
    (re.compile(r"\baudio\b", re.I), "audio"),
    (re.compile(r"\bvideo\b", re.I), "video"),
    (re.compile(r"\bimage\b", re.I), "input_image"),
]

PROMPT_ROLE_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bnegative\b", re.I), "negative"),
    (re.compile(r"\bpositive\b", re.I), "positive"),
]

LATENT_ROOT_PATTERN = re.compile(r"^Empty.*Latent|LatentVideo$|ImageToVideo$", re.I)

# Nodes that combine/transform multiple distinct semantic signals (e.g.
# WanImageToVideo takes BOTH positive and negative conditioning and
# re-emits its own outputs). Forward slot-tracing must not walk PAST these,
# or a positive-prompt's path and a negative-prompt's path -- which both
# legitimately pass through the same merge node -- get conflated and look
# identical from that point on.
FORWARD_TRACE_STOP_PATTERN = re.compile(
    r"Sampler|Guider|Conditioning|ToVideo$|CreateVideo|SaveVideo|SaveImage|SaveAudio|VAEDecode",
    re.I,
)


def _model_role(class_type: str) -> str | None:
    if "loader" not in class_type.lower():
        return None
    for pattern, role in MODEL_ROLE_RULES:
        if pattern.search(class_type):
            return role
    return "other"


def _best_match(
    slot_names: list[str], rules: list[tuple[re.Pattern[str], str]], default: str
) -> str:
    best_rank = len(rules)
    best_role = default
    for slot in slot_names:
        for rank, (pattern, role) in enumerate(rules):
            if pattern.search(slot) and rank < best_rank:
                best_rank = rank
                best_role = role
    return best_role


class SemanticExtractor:
    def __init__(
        self,
        prompt_graph: JSONDict,
        workflow_blob: JSONDict | None,
        media_probe: MediaProbe,
    ):
        self.ev = GraphEvaluator(prompt_graph)
        self.workflow_blob = workflow_blob or {}
        self.media_probe = media_probe or {}
        self.warnings: list[str] = []

        self.output_nodes = self._find_output_nodes()
        self.output_media_type = self._infer_output_media_type()
        self.live_ids = (
            self.ev.live_node_ids([nid for nid, _ in self.output_nodes])
            if self.output_nodes
            else set(self.ev.nodes.keys())
        )
        self.subgraph_map = self._build_subgraph_map()

    # ---------- output node / media type ----------

    def _find_output_nodes(self) -> list[tuple[str, str]]:
        """Returns [(node_id, media_type), ...]."""
        found = []
        for nid, node in self.ev.nodes.items():
            ct = node.get("class_type", "")
            for media_type, pattern in OUTPUT_NODE_PATTERNS.items():
                if pattern.search(ct):
                    found.append((nid, media_type))
                    break
        if found:
            return found
        # fallback: nodes nothing else references
        referenced = set()
        for node in self.ev.nodes.values():
            for val in (node.get("inputs") or {}).values():
                if self.ev.is_link(val):
                    referenced.add(str(val[0]))
        leftover = [(nid, "unknown") for nid in self.ev.nodes if nid not in referenced]
        if not leftover:
            self.warnings.append("Could not identify any output node")
        return leftover

    def _infer_output_media_type(self) -> str:
        types = {mt for _, mt in self.output_nodes}
        if "video" in types:
            return "video"
        if "audio" in types:
            return "audio"
        if "image" in types:
            return "image"
        return "unknown"

    # ---------- subgraph name/id (workflow_name / workflow_id) ----------

    def _build_subgraph_map(self) -> dict[str, dict]:
        """Maps node-id-prefix -> {'id':, 'name':} for any subgraph-backed
        nodes, by cross-referencing workflow.nodes[].type (a subgraph UUID)
        against workflow.definitions.subgraphs[].{id,name}."""
        defs = (self.workflow_blob.get("definitions") or {}).get("subgraphs") or []
        id_to_name = {d.get("id"): d.get("name") for d in defs if isinstance(d, dict)}
        mapping = {}
        for n in self.workflow_blob.get("nodes") or []:
            t = n.get("type")
            if isinstance(t, str) and t in id_to_name:
                mapping[str(n.get("id"))] = {"id": t, "name": id_to_name[t]}
        return mapping

    def workflow_name_and_id(self) -> tuple[str | None, str | None, str | None]:
        """Returns (workflow_name, workflow_id, source) where source explains
        which heuristic produced the value."""
        if self.subgraph_map:
            # if multiple, just take the first -- typically there's one
            # top-level subgraph wrapping the whole pipeline
            info = next(iter(self.subgraph_map.values()))
            return info["name"], info["id"], "subgraph_definition"

        # fallback: filename_prefix on the save node
        for nid, _ in self.output_nodes:
            node = self.ev.get(nid)
            prefix = (node.get("inputs") or {}).get("filename_prefix")
            if isinstance(prefix, str) and prefix:
                name = prefix.rsplit("/", 1)[-1]
                return name, self.workflow_blob.get("id"), "filename_prefix_fallback"

        return None, self.workflow_blob.get("id"), "none_found"

    # ---------- sampler stage detection ----------

    def _sampler_nodes(self) -> list[str]:
        return [
            nid
            for nid in self.live_ids
            if SAMPLER_NODE_PATTERN.match(self.ev.class_type(nid) or "")
        ]

    def _traces_through_sampler(
        self, start_id: str, _visited: set | None = None
    ) -> bool:
        visited = _visited if _visited is not None else set()
        if start_id in visited or start_id not in self.live_ids:
            return False
        visited.add(start_id)
        if SAMPLER_NODE_PATTERN.match(self.ev.class_type(start_id) or ""):
            return True
        node = self.ev.get(start_id)
        for val in (node.get("inputs") or {}).values():
            if self.ev.is_link(val) and self._traces_through_sampler(
                str(val[0]), visited
            ):
                return True
        return False

    def primary_sampler_id(self) -> str | None:
        samplers = self._sampler_nodes()
        if not samplers:
            return None
        roots = []
        for s in samplers:
            node = self.ev.get(s)
            if node is None:
                continue

            latent_in = (node.get("inputs") or {}).get("latent_image")

            if latent_in is not None and self.ev.is_link(latent_in):
                if not self._traces_through_sampler(
                    str(latent_in[0])
                ):  # pyright: ignore[reportOptionalSubscript]
                    roots.append(s)
            else:
                roots.append(s)  # no latent_image link at all -> trivially a root
        if roots:
            return roots[0]
        self.warnings.append(
            "All sampler nodes appear chained; picking the first as primary"
        )
        return samplers[0]

    # ---------- seed / steps / cfg / sampler / scheduler ----------

    def _literal(self, val: Any):
        return val if not isinstance(val, (NodeRef, AmbiguousBranch)) else None

    def sampling_params(self, sampler_id: str | None) -> SamplingParams:
        out: SamplingParams = {
            "seed": None,
            "sampler": None,
            "scheduler": None,
            "steps": None,
            "cfg": None,
        }
        if sampler_id is None:
            return out
        node = self.ev.get(sampler_id)
        inputs = node.get("inputs") or {}

        # seed
        for key in ("seed", "noise_seed"):
            if key in inputs:
                out["seed"] = self._literal(self.ev.fold_value(sampler_id, key))
                break
        if out["seed"] is None and "noise" in inputs:
            noise_val = self.ev.fold_value(sampler_id, "noise")
            if isinstance(noise_val, NodeRef):
                out["seed"] = self._literal(
                    self.ev.fold_value(noise_val.node_id, "noise_seed")
                )

        # steps
        if "steps" in inputs:
            out["steps"] = self._literal(self.ev.fold_value(sampler_id, "steps"))
        elif "sigmas" in inputs:
            sigmas_val = self.ev.fold_value(sampler_id, "sigmas")
            if isinstance(sigmas_val, NodeRef):
                target = self.ev.get(sigmas_val.node_id)
                tinputs = target.get("inputs") or {}
                if "steps" in tinputs:
                    out["steps"] = self._literal(
                        self.ev.fold_value(sigmas_val.node_id, "steps")
                    )
                elif "sigmas" in tinputs and isinstance(tinputs["sigmas"], str):
                    parts = [p for p in tinputs["sigmas"].split(",") if p.strip()]
                    out["steps"] = max(len(parts) - 1, 0)

        # cfg / guidance
        if "cfg" in inputs:
            out["cfg"] = self._literal(self.ev.fold_value(sampler_id, "cfg"))
        elif "guider" in inputs:
            guider_val = self.ev.fold_value(sampler_id, "guider")
            if isinstance(guider_val, NodeRef):
                gnode = self.ev.get(guider_val.node_id)
                ginputs = gnode.get("inputs") or {}
                if "cfg" in ginputs:
                    out["cfg"] = self._literal(
                        self.ev.fold_value(guider_val.node_id, "cfg")
                    )
                elif "conditioning" in ginputs:
                    cond_val = self.ev.fold_value(guider_val.node_id, "conditioning")
                    if isinstance(cond_val, NodeRef):
                        cnode = self.ev.get(cond_val.node_id)
                        if "guidance" in (cnode.get("inputs") or {}):
                            out["cfg"] = self._literal(
                                self.ev.fold_value(cond_val.node_id, "guidance")
                            )

        # sampler_name
        if "sampler_name" in inputs:
            out["sampler"] = self._literal(
                self.ev.fold_value(sampler_id, "sampler_name")
            )
        elif "sampler" in inputs:
            sampler_val = self.ev.fold_value(sampler_id, "sampler")
            if isinstance(sampler_val, NodeRef):
                out["sampler"] = self._literal(
                    self.ev.fold_value(sampler_val.node_id, "sampler_name")
                )

        # scheduler
        if "scheduler" in inputs:
            out["scheduler"] = self._literal(
                self.ev.fold_value(sampler_id, "scheduler")
            )
        elif "sigmas" in inputs:
            sigmas_val = self.ev.fold_value(sampler_id, "sigmas")
            if isinstance(sigmas_val, NodeRef):
                ct = sigmas_val.class_type or ""
                if ct == "ManualSigmas":
                    out["scheduler"] = "manual"
                elif "scheduler" in ct.lower():
                    out["scheduler"] = ct

        return out

    # ---------- requested width / height ----------

    def requested_dimensions(self, sampler_id: str | None) -> RequestedDimensions:
        result: RequestedDimensions = {
            "requested_width": None,
            "requested_height": None,
            "source": "",
        }

        # Tier 1: explicitly named "Width"/"Height" primitive nodes anywhere
        # in the live graph -- these are the user-facing exposed knobs.
        width_node = height_node = None
        for nid in self.live_ids:
            node = self.ev.get(nid)
            if node.get("class_type") not in ("PrimitiveInt", "PrimitiveFloat"):
                continue
            title = ((node.get("_meta") or {}).get("title") or "").strip().lower()
            if title == "width":
                width_node = nid
            elif title == "height":
                height_node = nid
        if width_node and height_node:
            result["requested_width"] = self._literal(
                self.ev.fold_value(width_node, "value")
            )
            result["requested_height"] = self._literal(
                self.ev.fold_value(height_node, "value")
            )
            result["source"] = "named_primitive"
            return result

        # Tier 2: walk back from the primary sampler's latent chain to the
        # root latent-init node and read its width/height inputs directly.
        if sampler_id:
            root = self._find_latent_root(sampler_id)
            if root:
                node = self.ev.get(root)
                if "width" in (node.get("inputs") or {}):
                    result["requested_width"] = self._literal(
                        self.ev.fold_value(root, "width")
                    )
                    result["requested_height"] = self._literal(
                        self.ev.fold_value(root, "height")
                    )
                    result["source"] = f"latent_root:{node.get('class_type')}"
        return result

    def _find_latent_root(
        self, sampler_id: str, _visited: set | None = None
    ) -> str | None:
        visited = _visited if _visited is not None else set()
        node = self.ev.get(sampler_id)
        if sampler_id in visited:
            return None
        visited.add(sampler_id)
        ct = node.get("class_type", "")
        if LATENT_ROOT_PATTERN.search(ct) or (
            "width" in (node.get("inputs") or {})
            and "height" in (node.get("inputs") or {})
        ):
            return sampler_id
        for val in (node.get("inputs") or {}).values():
            if self.ev.is_link(val):
                found = self._find_latent_root(str(val[0]), visited)
                if found:
                    return found
        return None

    # ---------- frame count (videos) ----------

    def frame_count(self) -> FrameCountInfo:
        for key in ("length", "frames_number", "num_frames", "frame_count"):
            for nid in self.live_ids:
                node = self.ev.get(nid)
                if node is None:
                    continue
                if key in (node.get("inputs") or {}):
                    val = self._literal(self.ev.fold_value(nid, key))
                    if isinstance(val, (int, float)):
                        return {
                            "frame_count": int(val),
                            "source": f"graph:{node.get('class_type')}.{key}",
                        }
        return {"frame_count": None, "source": None}

    # ---------- forward-trace helper (asset roles, prompt roles) ----------

    def _forward_slot_names(self, source_id: str, max_hops: int = 5) -> list[str]:
        slots = []
        frontier = {source_id}
        visited = set()
        for _ in range(max_hops):
            next_frontier = set()
            for nid in self.live_ids:
                if nid in visited:
                    continue
                node = self.ev.get(nid)
                for slot_name, val in (node.get("inputs") or {}).items():
                    if self.ev.is_link(val) and str(val[0]) in frontier:
                        slots.append(slot_name)
                        # Don't propagate past a node that merges/transforms
                        # multiple distinct semantic signals -- continuing
                        # would conflate e.g. positive- and negative-prompt
                        # paths that both legitimately pass through it.
                        if not FORWARD_TRACE_STOP_PATTERN.search(
                            node.get("class_type", "")
                        ):
                            next_frontier.add(nid)
            if not next_frontier:
                break
            visited |= next_frontier
            frontier = next_frontier
        return slots

    # ---------- prompts ----------

    def all_prompts(self) -> list[PromptUsed]:
        text_nodes = [
            nid
            for nid in self.live_ids
            if TEXT_ENCODE_PATTERN.search(self.ev.class_type(nid) or "")
        ]
        results: list[PromptUsed] = []
        single = len(text_nodes) == 1
        for nid in text_nodes:
            node = self.ev.get(nid)
            if node is None:
                continue

            text_val = None
            for key in ("text", "text_g", "text_l"):
                if key in (node.get("inputs") or {}):
                    text_val = self._literal(self.ev.fold_value(nid, key))
                    break
            slots = self._forward_slot_names(nid, max_hops=3)
            if single:
                role = "positive"
            else:
                role = _best_match(slots, PROMPT_ROLE_RULES, default="unknown")
            results.append(
                {
                    "node_id": nid,
                    "title": self.ev.title(nid),
                    "role": role,
                    "text": text_val,
                }
            )
        return results

    def positive_negative(
        self, prompts: list[PromptUsed]
    ) -> tuple[str | None, str | None]:
        pos = next((p["text"] for p in prompts if p["role"] == "positive"), None)
        neg = next((p["text"] for p in prompts if p["role"] == "negative"), None)
        return pos, neg

    # ---------- input assets ----------

    def input_assets(self) -> list[InputAssetInfo]:
        asset_nodes = [
            nid
            for nid in self.live_ids
            if ASSET_SOURCE_PATTERN.search(self.ev.class_type(nid) or "")
        ]
        results: list[InputAssetInfo] = []
        for nid in asset_nodes:
            node = self.ev.get(nid)
            if node is None:
                continue

            slots = self._forward_slot_names(nid, max_hops=5)
            role = _best_match(slots, ASSET_ROLE_RULES, default="other")
            value = None
            inputs: JSONDict = node.get("inputs") or {}
            for key in ("image", "audio", "video"):
                if key in inputs and isinstance(inputs[key], str):
                    value = inputs[key]
                    break
            results.append(
                {
                    "node_id": nid,
                    "class_type": node.get("class_type"),
                    "title": self.ev.title(nid),
                    "role": role,
                    "value": value,
                }
            )
        return results

    # ---------- models ----------

    def models(self) -> list[ModelUsedInfo]:
        results: list[ModelUsedInfo] = []
        for nid in self.live_ids:
            node = self.ev.get(nid)
            if node is None:
                continue

            ct = node.get("class_type", "")
            role = _model_role(ct)
            if role is None:
                continue
            inputs: JSONDict = node.get("inputs") or {}
            name: str | None = None
            for key in (
                "ckpt_name",
                "unet_name",
                "lora_name",
                "vae_name",
                "clip_name",
                "control_net_name",
                "model_name",
                "text_encoder",
            ):
                if key in inputs and isinstance(inputs[key], str):
                    name = inputs[key]
                    break
            strength: StrengthInfo = {}
            for key in ("strength_model", "strength_clip", "strength"):
                if key in inputs:
                    v = self._literal(self.ev.fold_value(nid, key))
                    if v is not None:
                        strength[key] = v

            results.append(
                {
                    "node_id": nid,
                    "class_type": ct,
                    "title": self.ev.title(nid),
                    "role": role,
                    "name": name,
                    **strength,
                }
            )
        return results

    def primary_model(
        self, models: list[ModelUsedInfo], sampler_id: str | None = None
    ) -> ModelUsedInfo | None:
        """Prefer the model that actually feeds the primary sampler's
        'model' input (walking through any wrapper nodes like
        ModelSamplingSD3 in between) -- this matters for dual-model
        architectures (e.g. Wan2.2's high/low-noise split) where multiple
        nodes legitimately have role=primary_generation_model and picking
        the 'first one found' would be arbitrary."""
        if sampler_id:
            traced_id = self._trace_primary_model_node(sampler_id)
            if traced_id:
                match = next((m for m in models if m["node_id"] == traced_id), None)
                if match:
                    return match
        for m in models:
            if m["role"] == "primary_generation_model":
                return m
        return None

    def _trace_primary_model_node(
        self, start_id: str, _visited: set | None = None
    ) -> str | None:
        visited = _visited if _visited is not None else set()
        current = start_id
        while current not in visited:
            visited.add(current)
            node = self.ev.get(current)
            if node is None:
                return None
            inputs = node.get("inputs") or {}
            if "model" not in inputs:
                return (
                    current
                    if _model_role(node.get("class_type", ""))
                    == "primary_generation_model"
                    else None
                )
            val = self.ev.fold_value(current, "model")
            if isinstance(val, NodeRef):
                if _model_role(val.class_type or "") == "primary_generation_model":
                    return val.node_id
                current = val.node_id
            else:
                return None
        return None

    # ---------- workflow_type ----------

    def infer_workflow_type(self, assets: list[InputAssetInfo]) -> WorkflowTypeInfo:
        roles = [a["role"] for a in assets]
        image_roles = {"first_frame", "last_frame", "reference_image", "input_image"}
        n_image_inputs = sum(1 for r in roles if r in image_roles)
        has_audio_in = "audio" in roles
        has_video_in = "video" in roles
        out_media = self.output_media_type

        if out_media == "image":
            if n_image_inputs == 0:
                wtype = "text-to-image"
            elif n_image_inputs >= 2:
                wtype = "multi-ref-image"
            else:
                wtype = "image-to-image"
        elif out_media == "video":
            if has_video_in:
                wtype = "video-to-video"
            elif n_image_inputs >= 2:
                wtype = "multi-ref-image-to-video"
            elif n_image_inputs == 1 and has_audio_in:
                wtype = "image-and-audio-to-video"
            elif n_image_inputs == 1:
                wtype = "image-to-video"
            elif has_audio_in:
                wtype = "audio-to-video"
            else:
                wtype = "text-to-video"
        elif out_media == "audio":
            wtype = "text-to-audio" if not roles else "conditioned-audio"
        else:
            wtype = "unknown"

        return {
            "workflow_type": wtype,
            "basis": {
                "output_media_type": out_media,
                "image_input_count": n_image_inputs,
                "has_audio_input": has_audio_in,
                "has_video_input": has_video_in,
            },
        }
