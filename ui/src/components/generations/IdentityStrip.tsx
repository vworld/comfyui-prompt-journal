import { Copy, Hash } from "lucide-react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";
import type { GenerationDetailResponse } from "@/types";

import ShotSelector from "@/components/generations/shot-selector/ShotSelector";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { writeToClipboard } from "@/lib/clipboard";
import { UnexpectedError } from "@/lib/unexpected-error";
import { cn } from "@/lib/utils";

export default function IdentityStrip({
  generation,
  generationShotState,
}: Readonly<{
  generation: GenerationDetailResponse;
  generationShotState: UseGenerationState["shot"];
}>) {
  const output = generation.generation_assets.find((a) => a.assoc_type === "output");
  if (!output) {
    throw new UnexpectedError("IdentityStrip: Output asset not found");
  }

  return (
    <div
      className={cn(
        "flex justify-between items-center flex-wrap",
        "h-11 p-2 bg-card text-sm",
        "rounded-md border border-border",
      )}
    >
      <div className="flex gap-2 items-center">
        <AssetIcon outputAsset={output.asset} />

        <ShotSelector
          generationId={generation.id}
          shot={generation.shot}
          generationShotState={generationShotState}
        />
      </div>
      <SeedLabel seed={generation.seed} />
    </div>
  );
}

function SeedLabel({ seed }: Readonly<{ seed: number | null }>) {
  function copySeed() {
    void writeToClipboard(seed?.toString() ?? "seed not found");
  }
  return (
    <HoverCard>
      <HoverCardTrigger delay={100}>
        <div
          className={cn(
            "flex items-center gap-1",
            "cursor-pointer bg-muted rounded-md",
            "text-xs px-2 py-1",
            "transition-colors hover:bg-muted/80",
          )}
          onClick={copySeed}
        >
          {/* <span className="text-muted-foreground">Seed: </span> */}
          <Hash className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{seed ?? "na"}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        className="flex items-center cursor-pointer text-base w-auto gap-2"
        side="top"
        onClick={copySeed}
      >
        <div className="space-y-2">
          <div className="font-mono whitespace-nowrap">Seed: {seed ?? "not found"}</div>
        </div>
        <Copy className="text-muted-foreground shrink-0" size={14} />
      </HoverCardContent>
    </HoverCard>
  );
}
