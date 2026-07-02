import { useEffect } from "react";

import Footer from "@/components/generations/Footer";
import GenerationMetadata from "@/components/generations/GenerationMetadata";
import IdentityStrip from "@/components/generations/IdentityStrip";
import MediaStrip from "@/components/generations/MediaStrip";
import ReviewsRow from "@/components/generations/ReviewsRow";
import PromptsTabView from "@/components/generations/prompts/PromptsTabView";
import { useGenerationState } from "@/components/generations/use-generation-state";
import { formatPrompts } from "@/lib/format-prompts";
import { cn } from "@/lib/utils";

export function ReviewConsole({ generationId }: Readonly<{ generationId: number }>) {
  const state = useGenerationState();
  const generation = state.generation;
  const fetchGeneration = state.fetchGeneration;

  useEffect(() => {
    void fetchGeneration(generationId);
  }, [generationId, fetchGeneration]);

  if (!generation) return null; // <NoUnreviewedGenerationFound />;
  return (
    <div className={cn("flex flex-col grow m-2 mb-0 gap-3.5")}>
      <IdentityStrip generation={generation} generationShotState={state.shot} />

      <div
        className={cn(
          "flex flex-col md:flex-row gap-4 md:gap-0",
          "md:h-70",
          "md:border md:border-b-0 md:border-border md:rounded-md",
        )}
      >
        <div
          className={cn(
            "w-full md:basis-1/2",
            "md:max-w-137.5",
            "h-70 p-1",
            "border rounded-md md:border-b md:border-r md:rounded-r-0 md:rounded-b-0",
          )}
        >
          <MediaStrip assets={generation.generation_assets} />
        </div>
        <div
          className={cn(
            "w-full md:basis-[50%]",
            "min-w-[375pz] grow",
            "pt-1",
            "border border-border md:border-b ",
          )}
        >
          <GenerationMetadata generation={generation} />
        </div>
      </div>

      <PromptsTabView prompts={formatPrompts(generation)} />

      <ReviewsRow generation={generation} manualReview={state.manualReview} />

      <Footer state={state} />
    </div>
  );
}
