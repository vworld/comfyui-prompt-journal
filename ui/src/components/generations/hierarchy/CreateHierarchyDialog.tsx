import { ChevronRight, Clapperboard, FolderOpen, FolderTree } from "lucide-react";
import { useReducer, useState } from "react";

import type { CreateItemField } from "@/components/generations/hierarchy/types";
import type { ClipResponse, ProjectResponse, SceneResponse, ShotResponse } from "@/types";

import { CreateItemDialog } from "@/components/generations/hierarchy/CreateItemDialog";
import { HierarchyRow } from "@/components/generations/hierarchy/HierarchyRow";
import { ShotRow } from "@/components/generations/hierarchy/ShotRow";
import {
  HIERARCHY_EMPTY_TEXT,
  HIERARCHY_PLACEHOLDER_TEXT,
  INITIAL_HIERARCHY_STATE,
} from "@/components/generations/hierarchy/constants";
import {
  hierarchyReducer,
  isAddClipEnabled,
  isAddProjectEnabled,
  isAddSceneEnabled,
  isAddShotEnabled,
  isClipEnabled,
  isSceneEnabled,
  isShotEnabled,
} from "@/components/generations/hierarchy/hierarchy-reducer";
import { useHierarchyActions } from "@/components/generations/hierarchy/use-hierarchy-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/SettingsContext";

interface CreateHierarchyDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Called once a shot has been created/selected and the user confirms. */
  setShotSelect: (shot: ShotResponse) => void;
  isModal: boolean;
}

export default function CreateHierarchyDialog({
  open,
  setOpen,
  setShotSelect,
  isModal,
}: Readonly<CreateHierarchyDialogProps>) {
  const [state, dispatch] = useReducer(hierarchyReducer, INITIAL_HIERARCHY_STATE);

  const settings = useSettings();
  // Seeded once from settings; the checkbox lets the user override it for
  // this session without touching the persisted setting itself.
  const [additionalInfo, setAdditionalInfo] = useState<boolean>(
    settings.settings.createPage.hierarchyCreation.alwaysEnterAdditionalInformation,
  );

  const actions = useHierarchyActions(state, dispatch, additionalInfo);

  const sceneEnabled = isSceneEnabled(state);
  const clipEnabled = isClipEnabled(state);
  const shotEnabled = isShotEnabled(state);

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      dispatch({ type: "RESET_ALL" });
      actions.closeCreateDialog();
    }
  };

  // Scene/Clip/Shot share the same "number + description + comments" shape,
  // differing only in which level's validate/getNextNumber they close over.
  const buildNumberedFields = (level: "scene" | "clip" | "shot"): CreateItemField[] => [
    {
      key: "number",
      label: `${level.charAt(0).toUpperCase()}${level.slice(1)} Number`,
      type: "number",
      validate: (value, signal) => actions.validateNumber(level, value, signal),
      getNextNumber: (signal) => actions.getNextNumber(level, signal),
    },
    { key: "description", label: "Description", type: "textarea" },
    { key: "comments", label: "Comments", type: "textarea" },
  ];

  // --- Footer primary action --------------------------------------------------
  const handleCreateAndSelectShot = () => {
    if (!state.shot.selected) return;
    setShotSelect(state.shot.selected);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={isModal}>
      <DialogContent className="sm:max-w-140 w-140">
        <DialogHeader className="flex flex-row items-center justify-between gap-2">
          <DialogTitle>Create Shot Hierarchy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">Project</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span
              className={sceneEnabled ? "font-medium text-foreground" : "text-muted-foreground"}
            >
              Scene
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className={clipEnabled ? "font-medium text-foreground" : "text-muted-foreground"}>
              Clip
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className={shotEnabled ? "font-medium text-foreground" : "text-muted-foreground"}>
              Shot
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Build the hierarchy step by step. You can select existing items or create new ones.
          </p>

          <div className="space-y-4">
            <HierarchyRow<ProjectResponse>
              level="project"
              icon={FolderOpen}
              label="Project"
              enabled
              isAddBtnEnabled={isAddProjectEnabled(state)}
              query={state.project.query}
              onQueryChange={(query) => dispatch({ type: "SET_QUERY", level: "project", query })}
              value={state.project.selected}
              onSelect={(item) =>
                item
                  ? dispatch({ type: "SELECT", level: "project", item })
                  : dispatch({ type: "CLEAR", level: "project" })
              }
              search={actions.searchProjectOptions}
              itemKey={(project) => project.id}
              itemLabel={(project) => project.name}
              placeholderEnabled={HIERARCHY_PLACEHOLDER_TEXT.project.enabled}
              placeholderDisabled={HIERARCHY_PLACEHOLDER_TEXT.project.enabled}
              emptyText={HIERARCHY_EMPTY_TEXT.project}
              onAddClick={() => actions.handleAddClick("project")}
              error={actions.rowErrors.project}
            />

            <Separator />

            <HierarchyRow<SceneResponse>
              level="scene"
              icon={FolderTree}
              label="Scene"
              enabled={sceneEnabled}
              isAddBtnEnabled={isAddSceneEnabled(state)}
              query={state.scene.query}
              onQueryChange={(query) => dispatch({ type: "SET_QUERY", level: "scene", query })}
              value={state.scene.selected}
              onSelect={(item) =>
                item
                  ? dispatch({ type: "SELECT", level: "scene", item })
                  : dispatch({ type: "CLEAR", level: "scene" })
              }
              search={actions.searchSceneOptions}
              itemKey={(scene) => scene.id}
              itemLabel={(scene) => scene.name}
              placeholderEnabled={HIERARCHY_PLACEHOLDER_TEXT.scene.enabled}
              placeholderDisabled={HIERARCHY_PLACEHOLDER_TEXT.scene.disabled!}
              emptyText={HIERARCHY_EMPTY_TEXT.scene}
              onAddClick={() => actions.handleAddClick("scene")}
              error={actions.rowErrors.scene}
            />

            <Separator />

            <HierarchyRow<ClipResponse>
              level="clip"
              icon={Clapperboard}
              label="Clip"
              enabled={clipEnabled}
              isAddBtnEnabled={isAddClipEnabled(state)}
              query={state.clip.query}
              onQueryChange={(query) => dispatch({ type: "SET_QUERY", level: "clip", query })}
              value={state.clip.selected}
              onSelect={(item) =>
                item
                  ? dispatch({ type: "SELECT", level: "clip", item })
                  : dispatch({ type: "CLEAR", level: "clip" })
              }
              search={actions.searchClipOptions}
              itemKey={(clip) => clip.id}
              itemLabel={(clip) => clip.name}
              placeholderEnabled={HIERARCHY_PLACEHOLDER_TEXT.clip.enabled}
              placeholderDisabled={HIERARCHY_PLACEHOLDER_TEXT.clip.disabled!}
              emptyText={HIERARCHY_EMPTY_TEXT.clip}
              onAddClick={() => actions.handleAddClick("clip")}
              error={actions.rowErrors.clip}
            />

            <Separator />

            <ShotRow
              enabled={shotEnabled}
              isAddBtnEnabled={isAddShotEnabled(state)}
              query={state.shot.query}
              onQueryChange={(query) => dispatch({ type: "SET_QUERY", level: "shot", query })}
              placeholderEnabled={HIERARCHY_PLACEHOLDER_TEXT.shot.enabled}
              placeholderDisabled={HIERARCHY_PLACEHOLDER_TEXT.shot.disabled!}
              onAddClick={() => actions.handleAddClick("shot")}
              error={actions.rowErrors.shot}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="additional-info"
                checked={additionalInfo}
                onCheckedChange={(checked) => setAdditionalInfo(checked)}
              />
              <label htmlFor="additional-info" className="text-xs font-medium whitespace-nowrap">
                Enter additional information when creating
              </label>
            </div>
            <p className="pl-7 text-xs text-muted-foreground">
              You'll be asked to provide more details for any new items.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 sm:w-auto">
            <Button onClick={handleCreateAndSelectShot} disabled={!state.shot.selected}>
              Create & Select Shot
            </Button>
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          </div>
        </DialogFooter>

        {/* Per-level "Add new {level}" dialogs — only one open at a time. */}
        <CreateItemDialog<ProjectResponse>
          level="project"
          levelLabel="Project"
          open={actions.createDialogLevel === "project"}
          onOpenChange={(next) => !next && actions.closeCreateDialog()}
          initialName={state.project.query}
          validateName={(name, signal) => actions.validateName("project", name, signal)}
          fields={[
            {
              key: "project_type",
              label: "Project type",
              type: "combo",
              required: true,
              placeholder: "Enter existing or new project type",
              emptyText: "No matching types — this will be added as a new one",
              search: actions.searchProjectTypes,
            },
            { key: "description", label: "Description", type: "textarea" },
          ]}
          onSubmit={(raw) => actions.createEntity("project", raw)}
          onCreated={(project) => dispatch({ type: "SELECT", level: "project", item: project })}
        />

        <CreateItemDialog<SceneResponse>
          level="scene"
          levelLabel="Scene"
          open={actions.createDialogLevel === "scene"}
          onOpenChange={(next) => !next && actions.closeCreateDialog()}
          initialName={state.scene.query}
          validateName={(name, signal) => actions.validateName("scene", name, signal)}
          fields={buildNumberedFields("scene")}
          onSubmit={(raw) => actions.createEntity("scene", raw)}
          onCreated={(scene) => dispatch({ type: "SELECT", level: "scene", item: scene })}
        />

        <CreateItemDialog<ClipResponse>
          level="clip"
          levelLabel="Clip"
          open={actions.createDialogLevel === "clip"}
          onOpenChange={(next) => !next && actions.closeCreateDialog()}
          initialName={state.clip.query}
          validateName={(name, signal) => actions.validateName("clip", name, signal)}
          fields={buildNumberedFields("clip")}
          onSubmit={(raw) => actions.createEntity("clip", raw)}
          onCreated={(clip) => dispatch({ type: "SELECT", level: "clip", item: clip })}
        />

        <CreateItemDialog<ShotResponse>
          level="shot"
          levelLabel="Shot"
          open={actions.createDialogLevel === "shot"}
          onOpenChange={(next) => !next && actions.closeCreateDialog()}
          initialName={state.shot.query}
          validateName={(name, signal) => actions.validateName("shot", name, signal)}
          fields={buildNumberedFields("shot")}
          onSubmit={(raw) => actions.createEntity("shot", raw)}
          onCreated={(shot) => dispatch({ type: "SELECT", level: "shot", item: shot })}
        />
      </DialogContent>
    </Dialog>
  );
}
