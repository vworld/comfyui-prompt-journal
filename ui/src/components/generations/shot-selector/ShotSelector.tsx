import { Pencil, Unlink, Unplug } from "lucide-react";
import { useEffect, useState } from "react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";
import type { ShotHierarchicalResponse } from "@/types";

import CreateHierarchyDialog from "@/components/generations/hierarchy/CreateHierarchyDialog";
import ShotSelectionDialog from "@/components/generations/shot-selector/ShotSelectionDialog";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export default function ShotSelector({
  generationId,
  shot,
  generationShotState,
}: Readonly<{
  generationId: number;
  shot: ShotHierarchicalResponse | null;
  generationShotState: UseGenerationState["shot"];
}>) {
  const [open, setOpen] = useState(false);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [selectedShotId, setSelectedShotId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  function handleOpen() {
    setOpen(true);
  }

  useEffect(() => {
    async function finalize() {
      if (!selectedShotId || shot?.id === selectedShotId) return;
      setLoading(true);
      if (await generationShotState.associateShotIdWithGeneration(selectedShotId)) {
        setOpen(false);
        setLoading(false);
      }
    }
    void finalize();
  }, [generationShotState, selectedShotId, shot?.id]);

  async function detachShot() {
    if (!shot) return;
    setLoading(true);
    await generationShotState.detachShotFromGeneration();
    setSelectedShotId(null);
    setLoading(false);
  }

  return (
    <>
      <div className="flex gap-1 items-center">
        {shot && (
          <>
            <span className="text-muted-foreground">
              {shot.clip.scene.number ?? 0}.{shot.clip.number ?? 0}.{shot.number ?? 0}:
            </span>
            <span className="text-primary-foreground">{shot.name}</span>

            {/* Select new show */}
            <HoverCard>
              <HoverCardTrigger>
                <Button disabled={loading} onClick={handleOpen} variant="ghost" size="icon">
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-fit" align="center" side="top">
                Select a new shot
              </HoverCardContent>
            </HoverCard>

            {/* Detach shot from generation */}
            <HoverCard>
              <HoverCardTrigger>
                <Button
                  disabled={loading}
                  onClick={() => void detachShot()}
                  variant="ghost"
                  size="icon"
                >
                  <Unlink className="size-3.5 text-muted-foreground" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-fit" side="top" align="center">
                Remove shot association
              </HoverCardContent>
            </HoverCard>
          </>
        )}
        {!shot && (
          <>
            {/* Select shot */}
            <Button onClick={handleOpen} variant={"default"} size="sm">
              <Unplug data-icon="inline-start" />
              Select Shot
            </Button>
            <span className="text-muted-foreground">No shot selected</span>
          </>
        )}

        <span className="text-muted-foreground text-xxs ml-3">[ gen_id: {generationId} ]</span>
      </div>

      <ShotSelectionDialog
        selectedShot={shot}
        open={open}
        setOpen={setOpen}
        setOpenCreate={setOpenCreate}
        onSelect={setSelectedShotId}
      />
      <CreateHierarchyDialog
        open={openCreate}
        setOpen={setOpenCreate}
        isModal={false}
        setShotSelect={(shot) => {
          setSelectedShotId(shot.id);
        }}
      />
    </>
  );
}
