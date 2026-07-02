import { useCallback, useState } from "react";
import { toast } from "sonner";

import { DEFAULT_PROJECT_TYPE, PROJECT_TYPE_HINTS, SEARCH_RESULT_LIMIT } from "./constants";

import type {
  FieldValidationResult,
  HierarchyAction,
  HierarchyItem,
  HierarchyLevel,
  HierarchyState,
} from "./types";
import type {
  ClipResponse,
  NextAvailableNumberResponse,
  ProjectResponse,
  SceneResponse,
  ShotResponse,
} from "@/types";
import type { Dispatch } from "react";

import {
  createClip,
  createProject,
  createScene,
  createShot,
  getNextClipNumber,
  getNextSceneNumber,
  getNextShotNumber,
  searchClip,
  searchProjects,
  searchScenes,
  validateClipName,
  validateClipNumber,
  validateProjectName,
  validateSceneName,
  validateSceneNumber,
  validateShotName,
  validateShotNumber,
} from "@/api/hierarchy";
import { UnexpectedError } from "@/lib/unexpected-error";

/**
 * Every level beyond project resolves its parent id from the level above.
 * Centralized here since search, create, validate, and next-number all
 * need the same lookup — previously duplicated across each of those.
 */
function getParentId(state: HierarchyState, level: HierarchyLevel): number | undefined {
  switch (level) {
    case "project": {
      return undefined;
    }
    case "scene": {
      return state.project.selected?.id;
    }
    case "clip": {
      return state.scene.selected?.id;
    }
    case "shot": {
      return state.clip.selected?.id;
    }
  }
}

function requireParentId(state: HierarchyState, level: HierarchyLevel): number {
  const parentId = getParentId(state, level);
  if (parentId === undefined) {
    throw new UnexpectedError(
      `Action for level "${level}" requires a parent id, but none was selected. This should be unreachable — the row should be disabled until its parent is selected.`,
    );
  }
  return parentId;
}

/**
 * Turns a { is_unique, duplicate } response into a plain result — the
 * backend only needs to say whether it's unique, not phrase the message.
 * Typed structurally rather than importing DuplicateValidationResponse,
 * which wasn't confirmed as an exported type.
 */
function toValidationResult(
  response: { is_unique: boolean; duplicate: HierarchyItem | null },
  levelLabel: string,
  value: string,
): FieldValidationResult {
  if (response.is_unique) return { isValid: true };
  return { isValid: false, message: `A ${levelLabel} with "${value}" already exists.` };
}

export function useHierarchyActions(
  state: HierarchyState,
  dispatch: Dispatch<HierarchyAction>,
  additionalInfo: boolean,
) {
  const [createDialogLevel, setCreateDialogLevel] = useState<HierarchyLevel | null>(null);
  const [rowErrors, setRowErrors] = useState<Partial<Record<HierarchyLevel, string>>>({});

  const clearRowError = useCallback((level: HierarchyLevel) => {
    setRowErrors((prev) => {
      if (!Object.hasOwn(prev, level)) return prev;
      const next = { ...prev };
      delete next[level];
      return next;
    });
  }, []);

  const closeCreateDialog = useCallback(() => setCreateDialogLevel(null), []);

  // --- Search -----------------------------------------------------------

  const searchProjectOptions = useCallback(
    (query: string, abortSignal: AbortSignal) =>
      searchProjects({ query, limit: SEARCH_RESULT_LIMIT, abortSignal }),
    [],
  );

  const searchSceneOptions = useCallback(
    (query: string, abortSignal: AbortSignal) => {
      const projectId = requireParentId(state, "scene");
      return searchScenes({ projectId, query, limit: SEARCH_RESULT_LIMIT, abortSignal });
    },
    [state],
  );

  const searchClipOptions = useCallback(
    (query: string, abortSignal: AbortSignal) => {
      const sceneId = requireParentId(state, "clip");
      return searchClip({ sceneId, query, limit: SEARCH_RESULT_LIMIT, abortSignal });
    },
    [state],
  );

  // Static list today; swap for a real "types used so far" endpoint later
  // by changing only this function.
  const searchProjectTypes = useCallback((query: string) => {
    const normalized = query.toLowerCase();
    return Promise.resolve(
      PROJECT_TYPE_HINTS.filter((hint) => hint.toLowerCase().includes(normalized)),
    );
  }, []);

  // --- Create -------------------------------------------------------------
  // Single place mapping raw form values -> real payload -> API call, used
  // by both the full-details dialog and the "use defaults" immediate path.
  // Overloaded so call sites with a literal level keep a specific return
  // type; handleAddClick below calls it with a widened HierarchyLevel.

  function createEntity(level: "project", raw: Record<string, string>): Promise<ProjectResponse>;
  function createEntity(level: "scene", raw: Record<string, string>): Promise<SceneResponse>;
  function createEntity(level: "clip", raw: Record<string, string>): Promise<ClipResponse>;
  function createEntity(level: "shot", raw: Record<string, string>): Promise<ShotResponse>;
  function createEntity(level: HierarchyLevel, raw: Record<string, string>): Promise<HierarchyItem>;
  function createEntity(
    level: HierarchyLevel,
    raw: Record<string, string>,
  ): Promise<HierarchyItem> {
    const name = raw.name.trim();

    switch (level) {
      case "project": {
        return createProject({
          payload: {
            name,
            // raw.project_type is only absent on the "use defaults" path —
            // the dialog path always supplies it as a required field.
            project_type: raw.project_type ?? DEFAULT_PROJECT_TYPE,
            description: raw.description?.trim() || null,
          },
        });
      }
      case "scene": {
        return createScene({
          projectId: requireParentId(state, "scene"),
          payload: {
            name,
            number: raw.number ? Number(raw.number) : null,
            description: raw.description?.trim() || null,
            comments: raw.comments?.trim() || null,
          },
        });
      }
      case "clip": {
        return createClip({
          sceneId: requireParentId(state, "clip"),
          payload: {
            name,
            number: raw.number ? Number(raw.number) : null,
            description: raw.description?.trim() || null,
            comments: raw.comments?.trim() || null,
          },
        });
      }
      case "shot": {
        return createShot({
          clipId: requireParentId(state, "shot"),
          payload: {
            name,
            number: raw.number ? Number(raw.number) : null,
            description: raw.description?.trim() || null,
            comments: raw.comments?.trim() || null,
          },
        });
      }
    }
  }

  // --- Add-button handling ------------------------------------------------

  const handleAddClick = (level: HierarchyLevel) => {
    if (additionalInfo) {
      clearRowError(level);
      setCreateDialogLevel(level);
      return;
    }

    const name = state[level].query.trim();
    if (!name) {
      setRowErrors((prev) => ({ ...prev, [level]: "Enter a name before adding." }));
      return;
    }

    clearRowError(level);
    void (async () => {
      try {
        const created = await createEntity(level, { name });
        dispatch({ type: "SELECT", level, item: created });
        toast.success(
          `${level.charAt(0).toUpperCase()}${level.slice(1)} successfully created (id: ${created.id}).`,
        );
      } catch (error) {
        console.error(`Failed to create ${level}`, error);
        setRowErrors((prev) => ({
          ...prev,
          [level]:
            (error as Error).message ?? `Couldn't create this ${level}. It may already exist.`,
        }));
      }
    })();
  };

  // --- Validation -----------------------------------------------------------
  // Blocking only: is_unique === false is always an error, never a warning.

  async function validateName(
    level: HierarchyLevel,
    name: string,
    signal?: AbortSignal,
  ): Promise<FieldValidationResult> {
    const trimmed = name.trim();
    switch (level) {
      case "project": {
        return toValidationResult(
          await validateProjectName({ name: trimmed, abortSignal: signal }),
          "project",
          trimmed,
        );
      }
      case "scene": {
        return toValidationResult(
          await validateSceneName({
            projectId: requireParentId(state, "scene"),
            name: trimmed,
            abortSignal: signal,
          }),
          "scene",
          trimmed,
        );
      }
      case "clip": {
        return toValidationResult(
          await validateClipName({
            sceneId: requireParentId(state, "clip"),
            name: trimmed,
            abortSignal: signal,
          }),
          "clip",
          trimmed,
        );
      }
      case "shot": {
        return toValidationResult(
          await validateShotName({
            clipId: requireParentId(state, "shot"),
            name: trimmed,
            abortSignal: signal,
          }),
          "shot",
          trimmed,
        );
      }
    }
  }

  async function validateNumber(
    level: HierarchyLevel,
    value: string,
    signal?: AbortSignal,
  ): Promise<FieldValidationResult> {
    const trimmed = value.trim();
    // Number is optional — nothing to validate when it's empty.
    if (!trimmed) return { isValid: true };
    const number = Number(trimmed);

    switch (level) {
      case "project": {
        throw new UnexpectedError("Project has no number field.");
      }
      case "scene": {
        return toValidationResult(
          await validateSceneNumber({
            projectId: requireParentId(state, "scene"),
            number,
            abortSignal: signal,
          }),
          "scene",
          trimmed,
        );
      }
      case "clip": {
        return toValidationResult(
          await validateClipNumber({
            sceneId: requireParentId(state, "clip"),
            number,
            abortSignal: signal,
          }),
          "clip",
          trimmed,
        );
      }
      case "shot": {
        return toValidationResult(
          await validateShotNumber({
            clipId: requireParentId(state, "shot"),
            number,
            abortSignal: signal,
          }),
          "shot",
          trimmed,
        );
      }
    }
  }

  // --- Next-number lookup ---------------------------------------------------

  async function getNextNumber(
    level: HierarchyLevel,
    signal?: AbortSignal,
  ): Promise<NextAvailableNumberResponse> {
    switch (level) {
      case "project": {
        throw new UnexpectedError("Project has no number field.");
      }
      case "scene": {
        return getNextSceneNumber({
          projectId: requireParentId(state, "scene"),
          abortSignal: signal,
        });
      }
      case "clip": {
        return getNextClipNumber({ sceneId: requireParentId(state, "clip"), abortSignal: signal });
      }
      case "shot": {
        return getNextShotNumber({ clipId: requireParentId(state, "shot"), abortSignal: signal });
      }
    }
  }

  return {
    createDialogLevel,
    closeCreateDialog,
    rowErrors,
    searchProjectOptions,
    searchSceneOptions,
    searchClipOptions,
    searchProjectTypes,
    handleAddClick,
    createEntity,
    validateName,
    validateNumber,
    getNextNumber,
  };
}
