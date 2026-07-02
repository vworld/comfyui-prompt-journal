import { UploadCloud } from "lucide-react";

import type { DropPhase } from "@/context/drag-drop/types";

interface ImportOverlayProps {
  phase: DropPhase;
}

export function ImportOverlay({ phase }: Readonly<ImportOverlayProps>) {
  if (phase !== "hovering") return null;

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-primary/60" />

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/90 px-10 py-8 shadow-xl">
        <UploadCloud className="size-9 text-primary" strokeWidth={1.5} />
        <div className="text-center">
          <p className="font-heading text-lg font-medium text-foreground">Drop to import</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Images, video, and audio with ComfyUI metadata
          </p>
        </div>
      </div>
    </div>
  );
}
