import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ClipResponse, SceneResponse } from "@/types";

import {
  createClip,
  deleteScene,
  getNextClipNumber,
  getSceneById,
  listClips,
  updateScene,
  validateClipName,
  validateClipNumber,
  validateSceneName,
  validateSceneNumber,
} from "@/api/hierarchy";
import {
  type ActionButton,
  EntityDetailsCard,
} from "@/components/explorer/details/EntityDetailsCard";
import EntityTabsSection from "@/components/explorer/details/EntityTabsSection";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { CreateItemDialog } from "@/components/generations/hierarchy/CreateItemDialog";
import { toValidationResult } from "@/components/generations/hierarchy/use-hierarchy-actions";
import { FormInputField } from "@/components/shared/FormInputField";
import { FormTextAreaField } from "@/components/shared/FormTextAreaField";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/context/AlertContext";
import { formatDate } from "@/lib/date-fmt";

interface SceneDetailProps {
  readonly selectedSceneId?: number | null;
}

export default function SceneDetail({ selectedSceneId }: SceneDetailProps) {
  const [scene, setScene] = useState<SceneResponse | null>(null);
  const [clips, setClips] = useState<ClipResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [number, setNumber] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [createClipOpen, setCreateClipOpen] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const { reportError, error: errorAlert, confirm: confirmAlert } = useAlert();
  const { updateNode, removeNode, addNode, handleSelect, selectNode } = useExplorerTree();

  const load = useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!selectedSceneId) {
        setScene(null);
        setClips([]);
        return;
      }
      setLoading(true);

      try {
        const s = await getSceneById(selectedSceneId, abortSignal);
        const sceneClips = await listClips(selectedSceneId, abortSignal);

        if (!abortSignal?.aborted) {
          setScene(s);
          setNumber(s.number?.toString() ?? "");
          setName(s.name);
          setDescription(s.description ?? "");
          setComments(s.comments ?? "");
          setClips(sceneClips);
        }
      } catch (error) {
        void reportError(error);
      } finally {
        setLoading(false);
      }
    },
    [reportError, selectedSceneId],
  );

  useEffect(() => {
    const abort = new AbortController();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, react-hooks/set-state-in-effect
    load(abort.signal);
    return () => {
      abort.abort();
    };
  }, [load]);

  // Sync tree selection when scene is loaded
  useEffect(() => {
    if (!scene || loading) return;

    const abort = new AbortController();
    selectNode({ node: { kind: "scene", data: scene }, abortController: abort, pane: "tree" });

    return () => abort.abort();
  }, [scene, loading, selectNode]);

  if (!selectedSceneId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select an item in the explorer
      </div>
    );
  }

  if (!scene && !loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Scene not found
      </div>
    );
  }

  if (loading || !scene) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  const dirty =
    number !== (scene.number?.toString() ?? "") ||
    name !== scene.name ||
    description !== (scene.description ?? "") ||
    comments !== (scene.comments ?? "");

  const handleSave = async () => {
    if (!scene) return;

    // Validate name if changed
    if (name.trim() && nameError) {
      return;
    }

    // Validate number if changed
    if (number.trim() && numberError) {
      return;
    }

    // Client-side validation for required fields
    if (!name.trim()) {
      void errorAlert({ title: "Name is required" });
      return;
    }

    setSaving(true);
    try {
      const num = number.trim() ? Number(number) : null;
      const updated = await updateScene(scene.id, {
        number: num,
        name,
        description,
        comments,
      });
      setScene(updated);
      // Update the node in the tree to reflect the new name
      updateNode({ kind: "scene", data: updated });
      setNumberError(null);
      setNameError(null);
      toast.success("Scene saved successfully");
    } catch (error) {
      void errorAlert({ title: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const validateSceneNameField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return { isValid: false };
    }
    if (trimmed === scene.name) {
      setNameError(null);
      return { isValid: true };
    }
    try {
      const result = await validateSceneName({
        projectId: scene.project_id,
        name: trimmed,
      });
      console.log(result);
      if (!result.is_unique) {
        setNameError(
          `Duplicate name: already used by Scene: ${result.duplicate?.number ?? "id:" + result.duplicate?.id}`,
        );
        return {
          isValid: false,
          message: `Duplicate name: already used by Scene: ${result.duplicate?.number ?? "id:" + result.duplicate?.id}"`,
        };
      }
      setNameError(null);
      return { isValid: true };
    } catch {
      setNameError(null);
      return { isValid: true };
    }
  };

  const validateSceneNumberField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNumberError(null);
      return { isValid: true };
    }
    const num = Number(trimmed);
    if (num === scene.number) {
      setNumberError(null);
      return { isValid: true };
    }
    try {
      const result = await validateSceneNumber({
        projectId: scene.project_id,
        number: num,
      });
      if (!result.is_unique) {
        setNumberError(
          `Duplicate number: already used by "${result.duplicate?.name ?? "unknown"}"`,
        );
        return {
          isValid: false,
          message: `Duplicate number: already used by "${result.duplicate?.name ?? "unknown"}"`,
        };
      }
      setNumberError(null);
      return { isValid: true };
    } catch {
      setNumberError(null);
      return { isValid: true };
    }
  };

  const handleDelete = async () => {
    if (!scene) return;
    if (clips.length > 0) {
      void errorAlert({
        title: "Cannot delete scene",
        description: "Delete all clips before deleting this scene.",
      });
      return;
    }
    const confirmed = await confirmAlert({
      title: `Delete scene "${scene.name}"?`,
      description: "This will permanently delete the scene. This action cannot be undone.",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteScene(scene.id);
      // Remove the node from the tree
      removeNode({ kind: "scene", id: scene.id });
      setScene(null);
      setClips([]);
      toast.success("Scene deleted");
      handleSelect({ kind: "explorer" });
    } catch (error) {
      void reportError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClip = async (raw: Record<string, string>): Promise<ClipResponse> => {
    return createClip({
      sceneId: scene.id,
      payload: {
        number: raw.number?.trim() ? Number(raw.number) : null,
        name: raw.name.trim(),
        description: raw.description?.trim() || null,
        comments: raw.comments?.trim() || null,
      },
    });
  };

  const onClipCreated = (newClip: ClipResponse) => {
    toast.info(`Clip: "${newClip.name}" created`);
    // Add the new clip to the clips list
    setClips((prev) => [...prev, newClip]);
    // Add the new clip to the tree under this scene
    addNode({ kind: "clip", data: newClip }, { kind: "scene", id: scene.id });
  };

  const actionButtons: ActionButton[] = [
    {
      label: "Delete",
      variant: "destructive",
      icon: <Trash2 />,
      onClick: handleDelete,
      hoverText:
        clips.length > 0
          ? "This scene cannot be deleted because it contains clips. Delete all clips first."
          : "This will permanently delete the scene.",
    },
    {
      label: "Add Clip",
      variant: "secondary",
      icon: <Plus />,
      onClick: () => setCreateClipOpen(true),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6 p-2 pt-0">
      <EntityDetailsCard
        title={scene.name}
        description={formatDate(new Date(scene.added_on * 1000))}
        onRefresh={load}
        actionButtons={actionButtons}
        className="bg-workspace"
        entityType="Scene"
      >
        <FormInputField
          id="scene-name"
          label="Name"
          required
          value={name}
          onChange={setName}
          validator={validateSceneNameField}
          error={nameError}
        />
        <FormInputField
          id="scene-number"
          label="Number"
          value={number}
          onChange={setNumber}
          validator={validateSceneNumberField}
          error={numberError}
          placeholder="Optional scene number"
        />
        <FormTextAreaField label="Description" value={description} onChange={setDescription} />
        <FormTextAreaField label="Comments" value={comments} onChange={setComments} />
        <div className="flex justify-center">
          <Button
            className="w-[60%]"
            variant="secondary"
            onClick={() => void handleSave()}
            disabled={!dirty || saving || !!numberError || !!nameError}
          >
            Save Scene
          </Button>
        </div>
      </EntityDetailsCard>

      <EntityTabsSection<ClipResponse>
        itemLabel="Clips"
        items={clips}
        onItemClick={(clip) => handleSelect({ kind: "clip", data: clip })}
        sortByNumber
      />

      <CreateItemDialog<ClipResponse>
        level="clip"
        levelLabel="Clip"
        open={createClipOpen}
        onOpenChange={() => setCreateClipOpen(false)}
        initialName={""}
        validateName={async (nameVal, signal) => {
          const trimmed = nameVal.trim();
          return toValidationResult(
            await validateClipName({ sceneId: scene.id, name: trimmed, abortSignal: signal }),
            "clip",
            trimmed,
          );
        }}
        fields={[
          {
            key: "number",
            label: "Clip Number",
            type: "number",
            validate: async (value, signal) => {
              const trimmed = value.trim();
              if (!trimmed) return { isValid: true };
              const clipNumber = Number(trimmed);
              return toValidationResult(
                await validateClipNumber({
                  sceneId: scene.id,
                  number: clipNumber,
                  abortSignal: signal,
                }),
                "clip",
                trimmed,
              );
            },
            getNextNumber: (signal) => {
              return getNextClipNumber({ sceneId: scene.id, abortSignal: signal });
            },
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "comments", label: "Comments", type: "textarea" },
        ]}
        onSubmit={handleCreateClip}
        onCreated={onClipCreated}
      />
    </div>
  );
}
