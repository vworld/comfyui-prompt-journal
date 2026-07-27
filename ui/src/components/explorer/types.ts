import type { HierarchyItem } from "@/components/generations/hierarchy/types";
import type {
  ClipResponse,
  GenerationDetailResponse,
  ProjectResponse,
  SceneResponse,
  ShotResponse,
} from "@/types";
import type { RefObject } from "react";

/* ------------------------------------------------------------------ */
/*  TreeNode types                                                     */
/* ------------------------------------------------------------------ */

export type TreeNode =
  | { kind: "project"; data: ProjectResponse }
  | { kind: "scene"; data: SceneResponse }
  | { kind: "clip"; data: ClipResponse }
  | { kind: "shot"; data: ShotResponse }
  | { kind: "generation"; data: GenerationDetailResponse };

export type NodeKey =
  | { kind: "project"; id: number }
  | { kind: "scene"; id: number }
  | { kind: "clip"; id: number }
  | { kind: "shot"; id: number }
  | { kind: "generation"; id: number };

export type TreeNodeWithChildren = TreeNode & { _children?: TreeNodeWithChildren[] };

export interface UseProjectTree {
  treeRef: RefObject<HTMLDivElement | null>;
  unassignedRef: RefObject<HTMLDivElement | null>;
  assignedRef: RefObject<HTMLDivElement | null>;
  roots: TreeNodeWithChildren[];
  expanded: Set<string>;
  selectedId: string | null;
  assignedSelectedId: number | null;
  unassignedSelectedId: number | null;
  loading: Set<string>;
  toggle: (node: TreeNodeWithChildren) => void;
  handleSelect: (node: TreeNode | { kind: "explorer" }) => void;
  /** Set a node as selected in the tree (to be called by detail view pages). */
  selectNode: (options: {
    node: TreeNode;
    pane: "tree" | "assigned" | "unassigned";
    abortController: AbortController;
  }) => void;
  /** Update a node in the tree (e.g., after editing name). */
  updateNode: (node: TreeNode) => void;
  /** Add a node to the tree (e.g., after creating a project). */
  addNode: (node: TreeNode, parentKey?: NodeKey) => void;
  /** Remove a node from the tree (e.g., after deleting a project). */
  removeNode: (nodeOrKey: TreeNode | NodeKey) => void;
  sort: {
    numberedEntities<E extends Exclude<HierarchyItem, ProjectResponse>>(
      entities: E[],
      order?: "asc" | "desc",
    ): E[];

    // projects: (
    //   projects: ProjectResponse[],
    //   field?: "id" | "added_on",
    //   order?: "asc" | "desc",
    // ) => ProjectResponse[];

    generations: (
      generations: GenerationDetailResponse[],
      field?: "id" | "attempt_num" | "added_on",
      order?: "asc" | "desc",
    ) => GenerationDetailResponse[];
  };

  assignedTotal: number;
  setAssignedTotal: (value: number) => void;
  unassignedTotal: number;
  setUnassignedTotal: (value: number) => void;
}
