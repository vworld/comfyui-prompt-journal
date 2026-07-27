import { useCallback, useEffect, useMemo } from "react";

import type { TreeNodeWithChildren, UseProjectTree } from "@/components/explorer/types";

import { useExplorerSidebar } from "@/components/explorer/tree-context/use-explorer-sidebar";
import { ExplorerTreeContext } from "@/components/explorer/tree-context/use-explorer-tree";

export interface ExplorerTreeProviderProps {
  readonly children: React.ReactNode;
}

export function ExplorerTreeProvider({ children }: ExplorerTreeProviderProps) {
  const {
    treeRef,
    unassignedRef,
    assignedRef,
    roots,
    expanded,
    selectedId,
    loading,
    loadRoots,
    addNode,
    updateNode,
    removeNode,
    expandTreeNode,
    expandNode,
    collapseNode,
    revealNodeInSidebar,
    handleNodeSelected,
    sortGenerations,
    sortNumberedEntities,
    assignedSelectedId,
    unassignedSelectedId,
    assignedTotal,
    setAssignedTotal,
    unassignedTotal,
    setUnassignedTotal,
  } = useExplorerSidebar();

  useEffect(() => {
    const abortController = new AbortController();
    void loadRoots(abortController.signal);
    return () => {
      abortController.abort();
    };
  }, [loadRoots]);

  const toggle = useCallback(
    (node: TreeNodeWithChildren) => {
      const process = async () => {
        const nodeId = `${node.kind}-${node.data.id}`;

        // collapse and return if expanded
        if (collapseNode(nodeId)) return;

        // toggle to expanded
        expandNode(nodeId);

        await expandTreeNode(node);
      };
      void process();
    },
    [collapseNode, expandNode, expandTreeNode],
  );

  const value: UseProjectTree = useMemo(
    () => ({
      treeRef,
      unassignedRef,
      assignedRef,
      roots,
      expanded,
      selectedId,
      loading,
      toggle,
      handleSelect: handleNodeSelected,
      selectNode: revealNodeInSidebar,
      updateNode,
      addNode,
      removeNode,
      sort: {
        numberedEntities: sortNumberedEntities,
        //projects: sortProjects,
        generations: sortGenerations,
      },
      assignedSelectedId,
      unassignedSelectedId,
      assignedTotal,
      setAssignedTotal,
      unassignedTotal,
      setUnassignedTotal,
    }),
    [
      treeRef,
      unassignedRef,
      assignedRef,
      roots,
      expanded,
      selectedId,
      loading,
      toggle,
      handleNodeSelected,
      revealNodeInSidebar,
      updateNode,
      addNode,
      removeNode,
      sortNumberedEntities,
      sortGenerations,
      assignedSelectedId,
      unassignedSelectedId,
      assignedTotal,
      setAssignedTotal,
      unassignedTotal,
      setUnassignedTotal,
    ],
  );

  return <ExplorerTreeContext value={value}>{children}</ExplorerTreeContext>;
}
