import type { HierarchyItem, HierarchyLevel, HierarchyState } from "./types";

export const SEARCH_RESULT_LIMIT = 10;

export const HIERARCHY_PLACEHOLDER_TEXT: Record<
  HierarchyLevel,
  { enabled: string; disabled?: string }
> = {
  project: { enabled: "Enter existing or new project name" },
  scene: { enabled: "Enter existing or new scene name", disabled: "Select project first" },
  clip: { enabled: "Enter existing or new clip name", disabled: "Select scene first" },
  shot: { enabled: "Enter existing or new shot name", disabled: "Select clip first" },
};

export const HIERARCHY_EMPTY_TEXT: Record<HierarchyLevel, string> = {
  project: "No matching projects found.",
  scene: "No matching scenes found.",
  clip: "No matching clips found.",
  shot: "", // shot row has no search / no empty state
};

/**
 * Temporary stand-in for a "project types used so far" endpoint that
 * doesn't exist yet. CreateHierarchyDialog wraps this in an async filter
 * function matching CreateItemField's `search` shape, so swapping it for a
 * real endpoint later is a one-line change there — nothing else moves.
 */
export const PROJECT_TYPE_HINTS = ["Long Video", "Short Video", "Images", "Experiments"];

/**
 * Used when a project is created via the "skip details" path (additionalInfo
 * off) — deliberately not one of PROJECT_TYPE_HINTS, so these projects stay
 * distinguishable from ones where the user actually chose a type.
 */
export const DEFAULT_PROJECT_TYPE = "default";

export const HIERARCHY_LEVEL_ORDER: HierarchyLevel[] = ["project", "scene", "clip", "shot"];

export const INITIAL_HIERARCHY_STATE: HierarchyState = {
  project: { query: "", selected: null },
  scene: { query: "", selected: null },
  clip: { query: "", selected: null },
  shot: { query: "", selected: null },
};

/**
 * Display label for a resolved item. Every level's Response type carries
 * `.name`, so this doesn't need to branch by level.
 *
 * Not strictly a "constant," but small and tightly coupled to the model
 * above — split into its own utils.ts if this file grows past a couple of
 * these.
 */
export function getItemLabel(item: HierarchyItem): string {
  return item.name;
}
