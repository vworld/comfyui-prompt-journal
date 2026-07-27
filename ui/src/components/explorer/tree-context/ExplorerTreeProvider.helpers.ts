import type { NodeKey, TreeNode, TreeNodeWithChildren } from "@/components/explorer/types";

function findNodeInTree(tree: TreeNodeWithChildren[], key: NodeKey): TreeNodeWithChildren | null {
  for (const n of tree) {
    if (n.kind === key.kind && n.data.id === key.id) {
      return n;
    }
    if (n._children) {
      const found = findNodeInTree(n._children, key);
      if (found) return found;
    }
  }
  return null;
}

function sortTreeNodeChildren(children: TreeNodeWithChildren[]): TreeNodeWithChildren[] {
  return children.toSorted((a, b) => {
    // All of scene/clip/shot have 'number' property
    const aNum = (a.data as { number: number | null }).number;
    const bNum = (b.data as { number: number | null }).number;
    if (aNum === bNum) return 0;
    if (aNum === null) return 1;
    if (bNum === null) return -1;
    return aNum - bNum;
  });
}

function sortGenerationTreeNodes(
  children: TreeNodeWithChildren[],
  field: "id" | "attempt_num" | "added_on" = "attempt_num",
): TreeNodeWithChildren[] {
  return children.toSorted((a, b) => {
    const aVal = a.data[field as keyof typeof a.data];
    const bVal = b.data[field as keyof typeof b.data];
    return aVal - bVal;
  });
}

function sortProjectTreeNodes(
  nodes: TreeNodeWithChildren[],
  field: "id" | "added_on" = "id",
): TreeNodeWithChildren[] {
  return nodes.toSorted((a, b) => {
    const aVal = a.data[field];
    const bVal = b.data[field];
    return aVal - bVal;
  });
}

function updateNodeInTree(tree: TreeNodeWithChildren[], node: TreeNode): TreeNodeWithChildren[] {
  const key = `${node.kind}-${node.data.id}`;

  return tree.map((n): TreeNodeWithChildren => {
    const nKey = `${n.kind}-${n.data.id}`;
    if (nKey === key) {
      // Merge updated node data but PRESERVE existing children, then re-sort
      const updatedNode = { ...n, data: node.data };
      // If this node has children, re-sort them based on the node kind
      if (n._children && ["scene", "clip", "shot"].includes(node.kind)) {
        return {
          ...updatedNode,
          _children: sortTreeNodeChildren(n._children),
        } as TreeNodeWithChildren;
      }
      return updatedNode as TreeNodeWithChildren;
    }
    if (n._children) {
      return {
        ...n,
        _children: updateNodeInTree(n._children, node),
      };
    }
    return n;
  });
}

function addNodeToTree(
  tree: TreeNodeWithChildren[],
  node: TreeNode,
  parentKey?: NodeKey,
): TreeNodeWithChildren[] {
  if (!parentKey) {
    // Root-level add (e.g., new project) - insert in sorted position
    return sortProjectTreeNodes([...tree, { ...node, _children: [] }]);
  }
  // Add as child of parent node - insert in sorted position
  const parentPath = `${parentKey.kind}-${parentKey.id}`;
  return tree.map((n) => {
    const nKey = `${n.kind}-${n.data.id}`;
    if (nKey === parentPath) {
      const existingChildren = n._children ?? [];
      // Re-sort children based on their kind
      const sortedChildren: TreeNodeWithChildren[] =
        node.kind === "generation"
          ? sortGenerationTreeNodes([...existingChildren, { ...node }])
          : sortTreeNodeChildren([...existingChildren, { ...node }]);
      return { ...n, _children: sortedChildren };
    }
    if (n._children) {
      return {
        ...n,
        _children: addNodeToTree(n._children, node, parentKey),
      };
    }
    return n;
  });
}

function removeNodeFromTree(tree: TreeNodeWithChildren[], key: NodeKey): TreeNodeWithChildren[] {
  const targetKey = `${key.kind}-${key.id}`;
  return tree
    .map((n) => {
      const nKey = `${n.kind}-${n.data.id}`;
      if (nKey === targetKey) {
        // This node is the target - remove it by returning null (will be filtered)
        return null;
      }
      if (n._children) {
        return {
          ...n,
          _children: removeNodeFromTree(n._children, key),
        };
      }
      return n;
    })
    .filter((n): n is TreeNodeWithChildren => n !== null);
}

function mergeChildren(
  tree: TreeNodeWithChildren[],
  parent: TreeNodeWithChildren,
  children: TreeNodeWithChildren[],
): TreeNodeWithChildren[] {
  return tree.map((node) => {
    if (node.kind === parent.kind && node.data.id === parent.data.id) {
      return { ...node, _children: children };
    }
    if (node._children) {
      return {
        ...node,
        _children: mergeChildren(node._children, parent, children),
      };
    }
    return node;
  });
}

export const ExplorerTreeHelpers = {
  mergeChildren,
  addNodeToTree,
  updateNodeInTree,
  removeNodeFromTree,
  findNodeInTree,
} as const;
