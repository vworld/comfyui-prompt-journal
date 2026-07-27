import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { NodeKey, TreeNode, TreeNodeWithChildren } from "@/components/explorer/types";
import type { HierarchyItem } from "@/components/generations/hierarchy/types";
import type { GenerationDetailResponse, ProjectResponse } from "@/types";

import {
  findPathToProjectId,
  listClips,
  listGenerations,
  listProjects,
  listScenes,
  listShots,
} from "@/api/hierarchy";
import { ExplorerTreeHelpers as Helpers } from "@/components/explorer/tree-context/ExplorerTreeProvider.helpers";
import { useAlert } from "@/context/AlertContext";

function keyToNodeId(key: NodeKey): string {
  return `${key.kind}-${key.id}`;
}

function sortNumberedEntities<E extends Exclude<HierarchyItem, ProjectResponse>>(
  entities: E[],
  order: "asc" | "desc" = "asc",
): E[] {
  return entities.toSorted((a, b) => {
    if (a.number === b.number) return 0;
    if (a.number === null) return 1;
    if (b.number === null) return -1;
    return order === "asc" ? a.number - b.number : b.number - a.number;
  });
}
function sortGenerations(
  generations: GenerationDetailResponse[],
  field: "id" | "attempt_num" | "added_on" = "attempt_num",
  order: "asc" | "desc" = "asc",
) {
  return generations.toSorted((a, b) =>
    order === "asc" ? a[field] - b[field] : b[field] - a[field],
  );
}

async function getProjects(
  signal: AbortSignal,
  orderBy: "id" | "added_on" = "id",
  sortOrder: "asc" | "desc" = "asc",
): Promise<TreeNodeWithChildren[]> {
  const data = await listProjects(signal);
  const projects = data.toSorted((a, b) =>
    sortOrder === "asc" ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy],
  );

  return projects.map((p) => ({ kind: "project", data: p }));
}

export function useExplorerSidebar(sortOrder: "asc" | "desc" = "asc") {
  const [roots, setRoots] = useState<TreeNodeWithChildren[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignedSelectedId, setAssignedSelectedId] = useState<number | null>(null);
  const [unassignedSelectedId, setUnassignedSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [assignedTotal, setAssignedTotal] = useState(0);
  const [unassignedTotal, setUnassignedTotal] = useState(0);

  const treeRef = useRef<HTMLDivElement>(null);
  const unassignedRef = useRef<HTMLDivElement>(null);
  const assignedRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { reportError } = useAlert();

  const expandNode = useCallback(
    (nodeId: string): boolean => {
      if (expanded.has(nodeId)) return false;

      setExpanded((prev) => new Set(prev).add(nodeId));
      return true;
    },
    [expanded],
  );

  const collapseNode = useCallback(
    (nodeId: string): boolean => {
      if (!expanded.has(nodeId)) return false;
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });

      return true;
    },
    [expanded],
  );

  const setLoadingState = useCallback((nodeId: string, loading: boolean) => {
    if (loading) {
      setLoading((prev) => new Set(prev).add(nodeId));
    } else {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, []);

  const loadRoots = useCallback(
    async (signal: AbortSignal, orderBy: "id" | "added_on" = "id"): Promise<void> => {
      console.log("loadRoots");
      try {
        const projects = await getProjects(signal, orderBy, sortOrder);

        if (!signal.aborted) {
          setRoots(projects);
        }
      } catch (error) {
        void reportError(error);
      }
    },
    [reportError, sortOrder],
  );

  const mergeToRoot = useCallback(
    (node: TreeNodeWithChildren, children: TreeNodeWithChildren[]) => {
      setRoots((prev) => Helpers.mergeChildren(prev, node, children));
    },
    [],
  );

  // TODO: consider if this pure method should be in the hook
  const fetchChildren = useCallback(
    async (node: {
      kind: TreeNode["kind"];
      data: Pick<TreeNode["data"], "id">;
    }): Promise<TreeNodeWithChildren[]> => {
      let children: TreeNodeWithChildren[] = [];

      switch (node.kind) {
        case "project": {
          const scenes = await listScenes(node.data.id);
          children = sortNumberedEntities(scenes).map((s) => ({
            kind: "scene",
            data: s,
          }));
          break;
        }
        case "scene": {
          const clips = await listClips(node.data.id);
          children = sortNumberedEntities(clips).map((c) => ({
            kind: "clip",
            data: c,
          }));
          break;
        }
        case "clip": {
          const shots = await listShots(node.data.id);
          children = sortNumberedEntities(shots).map((s) => ({
            kind: "shot",
            data: s,
          }));
          break;
        }
        case "shot": {
          const gens = await listGenerations(node.data.id);
          children = sortGenerations(gens).map((g) => ({
            kind: "generation",
            data: g,
          }));
          break;
        }
        case "generation": {
          break;
        }
      }

      return children;
    },
    [],
  );

  const handleNodeSelected = useCallback(
    (node: TreeNode | { kind: "explorer" }) => {
      if (node.kind === "explorer") {
        void navigate("/explorer");
        setSelectedId(null);
        return;
      }

      setSelectedId(`${node.kind}-${node.data.id}`);

      switch (node.kind) {
        case "project": {
          void navigate(`/explorer/projects/${node.data.id}`);
          break;
        }
        case "scene": {
          void navigate(`/explorer/scenes/${node.data.id}`);
          break;
        }
        case "clip": {
          void navigate(`/explorer/clips/${node.data.id}`);
          break;
        }
        case "shot": {
          void navigate(`/explorer/shots/${node.data.id}`);
          break;
        }
        case "generation": {
          void navigate(`/explorer/generations/${node.data.id}`);
          break;
        }
      }
    },
    [navigate],
  );

  const updateNode = useCallback((node: TreeNode) => {
    setRoots((prev) => Helpers.updateNodeInTree(prev, node));
  }, []);

  const addNode = useCallback((node: TreeNode, parentKey?: NodeKey) => {
    setRoots((prev) => Helpers.addNodeToTree(prev, node, parentKey));
  }, []);

  const removeNode = useCallback(
    (nodeOrKey: TreeNode | NodeKey) => {
      const key: NodeKey =
        "data" in nodeOrKey ? { kind: nodeOrKey.kind, id: nodeOrKey.data.id } : nodeOrKey;
      setRoots((prev) => Helpers.removeNodeFromTree(prev, key));
      if (selectedId === keyToNodeId(key)) {
        setSelectedId(null);
      }
    },
    [selectedId],
  );

  const expandTreeNode = useCallback(
    async (node: TreeNodeWithChildren) => {
      const nodeId = keyToNodeId({ kind: node.kind, id: node.data.id });
      // toggle to expanded
      expandNode(nodeId);
      // fetch children
      try {
        if (node._children && node._children.length > 0) return;
        setLoadingState(nodeId, true);
        const children = await fetchChildren(node);
        mergeToRoot(node, children);
      } catch (error) {
        void reportError(error);
      } finally {
        setLoadingState(nodeId, false);
      }
    },
    [expandNode, fetchChildren, mergeToRoot, reportError, setLoadingState],
  );

  const revealNodeInTree = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async (targetNodeKey: NodeKey, abortController: AbortController) => {
      const targetNodeId = keyToNodeId(targetNodeKey);

      if (selectedId === targetNodeId) return;

      let tree: TreeNodeWithChildren[] = roots;
      if (tree.length === 0 || !Helpers.findNodeInTree(tree, targetNodeKey)) {
        tree = await getProjects(abortController.signal);
      }

      const pathResponse =
        targetNodeKey.kind === "project"
          ? { path: [targetNodeKey] }
          : await findPathToProjectId({ entity: targetNodeKey.kind, id: targetNodeKey.id });

      // path is an ordered array of kind and id
      try {
        let parentNode: TreeNodeWithChildren | null = null;

        for (const p of pathResponse.path) {
          const curNodeKey: NodeKey = { kind: p.kind, id: p.id };
          if (targetNodeKey.kind !== "project") {
            const curNode = Helpers.findNodeInTree(tree, curNodeKey);

            if (!curNode) {
              if (!parentNode)
                throw new Error(`Parent for ${curNodeKey.kind}: ${curNodeKey.id} not found`);

              const children = await fetchChildren(parentNode);
              tree = Helpers.mergeChildren(tree, parentNode, children);
            }
          }

          parentNode = Helpers.findNodeInTree(tree, curNodeKey);

          if (abortController.signal.aborted) return;
        }
      } catch (error) {
        if (abortController.signal.aborted) return;
        void reportError(error);
        return;
      }
      if (abortController.signal.aborted) return;
      setRoots(tree);
      for (const p of pathResponse.path) {
        if (p.kind === targetNodeKey.kind && p.id === targetNodeKey.id) continue;

        expandNode(keyToNodeId(p));
      }
      setSelectedId(keyToNodeId({ kind: targetNodeKey.kind, id: targetNodeKey.id }));
    },
    [expandNode, fetchChildren, reportError, roots, selectedId],
  );

  const revealNodeInAssignedPane = useCallback((node: NodeKey) => {
    setAssignedSelectedId(node.id);
  }, []);
  const revealNodeInUnassignedPane = useCallback((node: NodeKey) => {
    setUnassignedSelectedId(node.id);
  }, []);

  const revealNodeInSidebar = useCallback(
    async ({
      node,
      pane,
      abortController,
    }: {
      node: TreeNode;
      pane: "tree" | "assigned" | "unassigned";
      abortController: AbortController;
    }) => {
      const nodeKey = { kind: node.kind, id: node.data.id };
      switch (pane) {
        case "tree": {
          await revealNodeInTree(nodeKey, abortController);
          break;
        }
        case "assigned": {
          revealNodeInAssignedPane(nodeKey);
          await revealNodeInTree(nodeKey, abortController);
          break;
        }
        case "unassigned": {
          setSelectedId(null);
          revealNodeInUnassignedPane(nodeKey);
        }
      }
    },
    [revealNodeInAssignedPane, revealNodeInTree, revealNodeInUnassignedPane],
  );

  return useMemo(
    () =>
      ({
        treeRef,
        unassignedRef,
        assignedRef,
        handleNodeSelected,
        roots,
        mergeToRoot,
        addNode,
        updateNode,
        removeNode,
        expanded,
        selectedId,
        loading,
        setLoadingState,
        loadRoots,
        expandTreeNode,
        revealNodeInSidebar,
        expandNode,
        collapseNode,
        fetchChildren,
        sortNumberedEntities,
        sortGenerations,
        assignedSelectedId,
        unassignedSelectedId,
        assignedTotal,
        unassignedTotal,
        setAssignedTotal,
        setUnassignedTotal,
      }) as const,
    [
      addNode,
      assignedSelectedId,
      assignedTotal,
      collapseNode,
      expandNode,
      expandTreeNode,
      expanded,
      fetchChildren,
      handleNodeSelected,
      loadRoots,
      loading,
      mergeToRoot,
      removeNode,
      revealNodeInSidebar,
      roots,
      selectedId,
      setLoadingState,
      unassignedSelectedId,
      unassignedTotal,
      updateNode,
    ],
  );
}
