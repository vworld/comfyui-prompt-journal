import { HIERARCHY_LEVEL_ORDER, INITIAL_HIERARCHY_STATE, getItemLabel } from "./constants";

import type { HierarchyAction, HierarchyLevel, HierarchyState } from "./types";

function downstreamLevels(level: HierarchyLevel): HierarchyLevel[] {
  const index = HIERARCHY_LEVEL_ORDER.indexOf(level);
  return HIERARCHY_LEVEL_ORDER.slice(index + 1);
}

/** Resets the given levels back to their empty row state. */
function clearLevels(state: HierarchyState, levels: HierarchyLevel[]): HierarchyState {
  if (levels.length === 0) return state;
  const next = { ...state };
  for (const level of levels) {
    next[level] = { query: "", selected: null };
  }
  return next;
}

export function hierarchyReducer(state: HierarchyState, action: HierarchyAction): HierarchyState {
  // console.log(action.type);
  // console.log({ state, action});
  // console.log( {stack: new Error("").stack?.split("\n")} )
  switch (action.type) {
    case "SET_QUERY": {
      // Updating the query preserves the current selection as long as the
      // query still exactly matches the selected item's label. Once the user
      // edits the query to something different, the selection becomes invalid
      // and this level (and all downstream levels) are cleared.
      const levelState = state[action.level];
      if (levelState.selected && action.query === getItemLabel(levelState.selected)) {
        return action.query === levelState.query
          ? state
          : { ...state, [action.level]: { ...levelState, query: action.query } };
      }

      const cleared = clearLevels(state, downstreamLevels(action.level));
      return {
        ...cleared,
        [action.level]: { query: action.query, selected: null },
      };
    }

    case "SELECT": {
      const cleared = clearLevels(state, downstreamLevels(action.level));
      return {
        ...cleared,
        [action.level]: {
          query: getItemLabel(action.item),
          selected: action.item,
        },
      };
    }

    case "CLEAR": {
      return clearLevels(state, [action.level, ...downstreamLevels(action.level)]);
    }

    case "RESET_ALL": {
      return INITIAL_HIERARCHY_STATE;
    }

    default: {
      return state;
    }
  }
}

export function isSceneEnabled(state: HierarchyState): boolean {
  return state.project.selected !== null;
}

export function isClipEnabled(state: HierarchyState): boolean {
  return isSceneEnabled(state) && state.scene.selected !== null;
}

export function isShotEnabled(state: HierarchyState): boolean {
  return isClipEnabled(state) && state.clip.selected !== null;
}

export function isAddProjectEnabled(state: HierarchyState): boolean {
  return state.project.selected === null;
}

export function isAddSceneEnabled(state: HierarchyState): boolean {
  return isSceneEnabled(state) && state.scene.selected === null;
}

export function isAddClipEnabled(state: HierarchyState): boolean {
  return isClipEnabled(state) && state.clip.selected === null;
}

export function isAddShotEnabled(state: HierarchyState): boolean {
  return isShotEnabled(state) && state.shot.selected === null;
}

/*

### Click Behavior

When the user clicks **Add**:

1. Determine the creation workflow based on the **"Enter additional information when creating"** option.

2. **If additional information is enabled:**

   * Open the create dialog.
   * Pre-fill the name field with the current query (which may be empty).
   * The dialog is responsible for validating the form before submission.

3. **If additional information is disabled:**

   * Validate that the current query contains a non-empty name after trimming whitespace.
   * If the name is empty, show a validation error and abort the operation.
   * Otherwise, create the entity immediately using the query as the name and default values for all remaining fields.

4. After a successful creation:

   * Select the newly created entity.
   * Update the hierarchy state exactly as if the user had selected an existing item.
   * Advance the workflow by enabling the next hierarchy level.

#### Validation

* Immediate creation requires a non-empty name.
* Dialog-based creation delegates all validation to the dialog.
* Entity uniqueness is enforced by the backend. If creation fails (for example, 
* because an entity with the same name already exists), display the error and leave the current hierarchy state unchanged.



*/
