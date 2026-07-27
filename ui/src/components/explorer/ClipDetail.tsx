import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ClipResponse, ShotResponse } from "@/types";

import {
  createShot,
  deleteClip,
  getClipById,
  getNextShotNumber,
  listShots,
  updateClip,
  validateClipName,
  validateClipNumber,
  validateShotName,
  validateShotNumber,
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

interface ClipDetailProps {
  readonly selectedClipId?: number | null;
}

export default function ClipDetail({ selectedClipId }: ClipDetailProps) {
  const [clip, setClip] = useState<ClipResponse | null>(null);
  const [shots, setShots] = useState<ShotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [number, setNumber] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [createShotOpen, setCreateShotOpen] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const { reportError, error: errorAlert, confirm: confirmAlert } = useAlert();
  const { updateNode, removeNode, addNode, handleSelect, selectNode } = useExplorerTree();

  const load = useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!selectedClipId) {
        setClip(null);
        setShots([]);
        return;
      }
      setLoading(true);

      try {
        const c = await getClipById(selectedClipId, abortSignal);
        const clipShots = await listShots(selectedClipId, abortSignal);

        if (!abortSignal?.aborted) {
          setClip(c);
          setNumber(c.number?.toString() ?? "");
          setName(c.name);
          setDescription(c.description ?? "");
          setComments(c.comments ?? "");
          setShots(clipShots);
        }
      } catch (error) {
        void reportError(error);
      } finally {
        setLoading(false);
      }
    },
    [reportError, selectedClipId],
  );

  useEffect(() => {
    const abort = new AbortController();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, react-hooks/set-state-in-effect
    load(abort.signal);
    return () => {
      abort.abort();
    };
  }, [load]);

  // Sync tree selection when clip is loaded
  useEffect(() => {
    if (!clip || loading) return;

    const abort = new AbortController();
    selectNode({ node: { kind: "clip", data: clip }, pane: "tree", abortController: abort });
    return () => abort.abort();
  }, [clip, loading, selectNode]);

  if (!selectedClipId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select an item in the explorer
      </div>
    );
  }

  if (!clip && !loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Clip not found
      </div>
    );
  }

  if (loading || !clip) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  const dirty =
    number !== (clip.number?.toString() ?? "") ||
    name !== clip.name ||
    description !== (clip.description ?? "") ||
    comments !== (clip.comments ?? "");

  const handleSave = async () => {
    if (!clip) return;

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
      const updated = await updateClip(clip.id, {
        number: num,
        name,
        description,
        comments,
      });
      setClip(updated);
      // Update the node in the tree to reflect the new name
      updateNode({ kind: "clip", data: updated });
      setNumberError(null);
      setNameError(null);
      toast.success("Clip saved successfully");
    } catch (error) {
      void errorAlert({ title: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const validateClipNameField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return { isValid: false };
    }
    if (trimmed === clip.name) {
      setNameError(null);
      return { isValid: true };
    }
    try {
      const result = await validateClipName({
        sceneId: clip.scene_id,
        name: trimmed,
      });
      if (!result.is_unique) {
        setNameError(`Duplicate name`);
        return {
          isValid: false,
          message: "Duplicate name",
        };
      }
      setNameError(null);
      return { isValid: true };
    } catch {
      setNameError(null);
      return { isValid: true };
    }
  };

  const validateClipNumberField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNumberError(null);
      return { isValid: true };
    }
    const num = Number(trimmed);
    if (num === clip.number) {
      setNumberError(null);
      return { isValid: true };
    }
    try {
      const result = await validateClipNumber({
        sceneId: clip.scene_id,
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
    if (!clip) return;
    if (shots.length > 0) {
      void errorAlert({
        title: "Cannot delete clip",
        description: "Delete all shots before deleting this clip.",
      });
      return;
    }
    const confirmed = await confirmAlert({
      title: `Delete clip "${clip.name}"?`,
      description: "This will permanently delete the clip. This action cannot be undone.",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteClip(clip.id);
      // Remove the node from the tree
      removeNode({ kind: "clip", id: clip.id });
      setClip(null);
      setShots([]);
      toast.success("Clip deleted");
      handleSelect({ kind: "explorer" });
    } catch (error) {
      void reportError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateShot = async (raw: Record<string, string>): Promise<ShotResponse> => {
    return createShot({
      clipId: clip.id,
      payload: {
        number: raw.number?.trim() ? Number(raw.number) : null,
        name: raw.name.trim(),
        description: raw.description?.trim() || null,
        comments: raw.comments?.trim() || null,
      },
    });
  };

  const onShotCreated = (newShot: ShotResponse) => {
    setShots((prev) => [...prev, newShot]);
    toast.success(`Shot: "${newShot.name}" created`);
    // Add the new shot to the tree under this clip
    addNode({ kind: "shot", data: newShot }, { kind: "clip", id: clip.id });
  };

  const actionButtons: ActionButton[] = [
    {
      label: "Delete",
      variant: "destructive",
      icon: <Trash2 />,
      onClick: handleDelete,
      hoverText:
        shots.length > 0
          ? "This clip cannot be deleted because it contains shots. Delete all shots first."
          : "This will permanently delete the clip.",
    },
    {
      label: "Add Shot",
      variant: "secondary",
      icon: <Plus />,
      onClick: () => setCreateShotOpen(true),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-2 pt-0">
      <EntityDetailsCard
        title={clip.name}
        description={formatDate(new Date(clip.added_on * 1000))}
        onRefresh={load}
        actionButtons={actionButtons}
        className="bg-workspace"
        entityType="clip"
      >
        <FormInputField
          id="clip-name"
          label="Name"
          required
          value={name}
          onChange={setName}
          validator={validateClipNameField}
          error={nameError}
        />
        <FormInputField
          id="clip-number"
          label="Number"
          value={number}
          onChange={setNumber}
          validator={validateClipNumberField}
          error={numberError}
          placeholder="Optional clip number"
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
            Save Clip
          </Button>
        </div>
      </EntityDetailsCard>

      <EntityTabsSection<ShotResponse>
        itemLabel="Shots"
        items={shots}
        onItemClick={(shot) => handleSelect({ kind: "shot", data: shot })}
        sortByNumber
      />

      <CreateItemDialog<ShotResponse>
        level="shot"
        levelLabel="Shot"
        open={createShotOpen}
        onOpenChange={() => setCreateShotOpen(false)}
        initialName={""}
        validateName={async (nameVal, signal) => {
          const trimmed = nameVal.trim();
          return toValidationResult(
            await validateShotName({ clipId: clip.id, name: trimmed, abortSignal: signal }),
            "shot",
            trimmed,
          );
        }}
        fields={[
          {
            key: "number",
            label: "Shot Number",
            type: "number",
            validate: async (value, signal) => {
              const trimmed = value.trim();
              if (!trimmed) return { isValid: true };
              const shotNumber = Number(trimmed);
              return toValidationResult(
                await validateShotNumber({
                  clipId: clip.id,
                  number: shotNumber,
                  abortSignal: signal,
                }),
                "shot",
                trimmed,
              );
            },
            getNextNumber: (signal) => {
              return getNextShotNumber({ clipId: clip.id, abortSignal: signal });
            },
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "comments", label: "Comments", type: "textarea" },
        ]}
        onSubmit={handleCreateShot}
        onCreated={onShotCreated}
      />
    </div>
  );
}
