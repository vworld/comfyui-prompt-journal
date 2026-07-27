import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { GenerationDetailResponse, ShotResponse } from "@/types";

import {
  deleteShot,
  getShotById,
  listGenerations,
  updateShot,
  validateShotName,
  validateShotNumber,
} from "@/api/hierarchy";
import {
  type ActionButton,
  EntityDetailsCard,
} from "@/components/explorer/details/EntityDetailsCard";
import GenerationsList from "@/components/explorer/details/GenerationsList";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { FormInputField } from "@/components/shared/FormInputField";
import { FormTextAreaField } from "@/components/shared/FormTextAreaField";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/context/AlertContext";
import { formatDate } from "@/lib/date-fmt";

interface ShotDetailProps {
  readonly selectedShotId?: number | null;
}

export default function ShotDetail({ selectedShotId }: ShotDetailProps) {
  const [shot, setShot] = useState<ShotResponse | null>(null);
  const [generations, setGenerations] = useState<GenerationDetailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [number, setNumber] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [numberError, setNumberError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const { reportError, error: errorAlert, confirm: confirmAlert } = useAlert();
  const { updateNode, removeNode, handleSelect, selectNode } = useExplorerTree();

  const load = useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!selectedShotId) {
        setShot(null);
        setGenerations([]);
        return;
      }
      setLoading(true);

      try {
        const s = await getShotById(selectedShotId, abortSignal);
        const gens = await listGenerations(selectedShotId, abortSignal);

        if (!abortSignal?.aborted) {
          setShot(s);
          setNumber(s.number?.toString() ?? "");
          setName(s.name);
          setDescription(s.description ?? "");
          setComments(s.comments ?? "");
          setGenerations(gens);
        }
      } catch (error) {
        void reportError(error);
      } finally {
        setLoading(false);
      }
    },
    [reportError, selectedShotId],
  );

  useEffect(() => {
    const abort = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(abort.signal);
    return () => {
      abort.abort();
    };
  }, [load]);

  // Sync tree selection when shot is loaded
  useEffect(() => {
    if (!shot || loading) return;

    const abort = new AbortController();
    selectNode({ node: { kind: "shot", data: shot }, abortController: abort, pane: "tree" });

    return () => abort.abort();
  }, [shot, loading, selectNode]);

  if (!selectedShotId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select an item in the explorer
      </div>
    );
  }

  if (!shot && !loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Shot not found
      </div>
    );
  }

  if (loading || !shot) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  const dirty =
    number !== (shot.number?.toString() ?? "") ||
    name !== shot.name ||
    description !== (shot.description ?? "") ||
    comments !== (shot.comments ?? "");

  const handleSave = async () => {
    if (!shot) return;

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
      const updated = await updateShot(shot.id, {
        number: num,
        name,
        description,
        comments,
      });
      setShot(updated);
      // Update the node in the tree to reflect the new name
      updateNode({ kind: "shot", data: updated });
      setNumberError(null);
      setNameError(null);
      toast.success("Shot saved successfully");
    } catch (error) {
      void errorAlert({ title: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const validateShotNameField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return { isValid: false };
    }
    if (trimmed === shot.name) {
      setNameError(null);
      return { isValid: true };
    }
    try {
      const result = await validateShotName({
        clipId: shot.clip_id,
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

  const validateShotNumberField = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNumberError(null);
      return { isValid: true };
    }
    const num = Number(trimmed);
    if (num === shot.number) {
      setNumberError(null);
      return { isValid: true };
    }
    try {
      const result = await validateShotNumber({
        clipId: shot.clip_id,
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
    if (!shot) return;
    if (generations.length > 0) {
      void errorAlert({
        title: "Cannot delete shot",
        description: "Delete all generations before deleting this shot.",
      });
      return;
    }
    const confirmed = await confirmAlert({
      title: `Delete shot "${shot.name}"?`,
      description: "This will permanently delete the shot. This action cannot be undone.",
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await deleteShot(shot.id);
      // Remove the node from the tree
      removeNode({ kind: "shot", id: shot.id });
      setShot(null);
      setGenerations([]);
      toast.success("Shot deleted");
      handleSelect({ kind: "explorer" });
    } catch (error) {
      void reportError(error);
    } finally {
      setSaving(false);
    }
  };

  const actionButtons: ActionButton[] = [
    {
      label: "Delete",
      variant: "destructive",
      icon: <Trash2 />,
      onClick: handleDelete,
      hoverText:
        generations.length > 0
          ? "This shot cannot be deleted because it contains generations. Delete all generations first."
          : "This will permanently delete the shot.",
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-2 pt-0">
      <EntityDetailsCard
        title={shot.name}
        description={formatDate(new Date(shot.added_on * 1000))}
        onRefresh={load}
        actionButtons={actionButtons}
        className="bg-workspace"
        entityType="Shot"
      >
        <FormInputField
          id="shot-name"
          label="Name"
          required
          value={name}
          onChange={setName}
          validator={validateShotNameField}
          error={nameError}
        />
        <FormInputField
          id="shot-number"
          label="Number"
          value={number}
          onChange={setNumber}
          validator={validateShotNumberField}
          error={numberError}
          placeholder="Optional shot number"
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
            Save Shot
          </Button>
        </div>
      </EntityDetailsCard>

      <GenerationsList
        generations={generations}
        onGenerationClick={(genId) => {
          const gen = generations.find((g) => g.id === genId);
          if (gen) {
            handleSelect({ kind: "generation", data: gen });
          }
        }}
      />
    </div>
  );
}
