import type {
  ClipResponse,
  NextAvailableNumberResponse,
  ProjectResponse,
  SceneResponse,
  ShotResponse,
} from "@/types";

export type HierarchyLevel = "project" | "scene" | "clip" | "shot";

/**
 * State for a single row in the hierarchy.
 *
 * `query` is the raw text currently shown in the row's combobox/input. It is
 * kept independently of `selected` because the user is free to type text
 * that doesn't match anything yet — that text is exactly what should prefill
 * the "Add new {level}" dialog. `selected` is null whenever the text doesn't
 * correspond to a chosen search result, and is only ever set by picking an
 * option (or by a successful create).
 *
 * Progression to the next level is gated on `selected !== null`, not on
 * `query` having length — free-typed text has no `id` to search children
 * against.
 */
export interface RowState<T> {
  query: string;
  selected: T | null;
}

export interface HierarchyState {
  project: RowState<ProjectResponse>;
  scene: RowState<SceneResponse>;
  clip: RowState<ClipResponse>;
  /**
   * NOTE: the shot row has no search of its own — any fuzzy shot search
   * happens upstream, before this dialog is even opened. Within this
   * dialog, `shot.selected` is only ever populated by a successful create.
   */
  shot: RowState<ShotResponse>;
}

export type HierarchyItem = ProjectResponse | SceneResponse | ClipResponse | ShotResponse;

/** Outcome of an async field check (name/number uniqueness). */
export interface FieldValidationResult {
  isValid: boolean;
  /** Only meaningful when isValid is false. */
  message?: string;
}

export type HierarchyAction =
  /** User typed in a row's combobox/input without selecting a match. */
  | { type: "SET_QUERY"; level: HierarchyLevel; query: string }
  /** User picked an existing item from search results, or a create dialog resolved. */
  | { type: "SELECT"; level: HierarchyLevel; item: HierarchyItem }
  /** User cleared a row (e.g. via a combobox's clear affordance). */
  | { type: "CLEAR"; level: HierarchyLevel }
  | { type: "RESET_ALL" };

export type CreateItemFieldType = "text" | "textarea" | "number" | "combo";

export interface CreateItemField {
  /** Property name this field's value is reported under in the submitted values. */
  key: string;
  label: string;
  type: CreateItemFieldType;
  required?: boolean;
  placeholder?: string;
  /**
   * Required when type === "combo". Returns hint options matching the query
   * — e.g. project types used so far. Selecting one autofills the text, but
   * it's never enforced: whatever the user has typed is always a valid
   * value, so a brand new type can be entered transparently.
   */
  search?: (query: string, signal: AbortSignal) => Promise<string[]>;
  /** Shown in the combo field's suggestion list when nothing matches. */
  emptyText?: string;
  /**
   * Number fields only. Runs on blur; is_unique === false blocks submission
   * (uniqueness, not a warning — the backend is the final authority for
   * anything this check itself fails to catch, e.g. a race).
   */
  validate?: (value: string, signal: AbortSignal) => Promise<FieldValidationResult>;
  /** Number fields only. Powers the "Use next number" button. */
  getNextNumber?: (signal?: AbortSignal) => Promise<NextAvailableNumberResponse>;
}
