import { ChevronLeft, ChevronRight, Circle, History, Play } from "lucide-react";
import { useEffect, useState } from "react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";
import type { GenerationDetailResponse } from "@/types";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatDate } from "@/lib/date-fmt";
import { cn } from "@/lib/utils";

export default function AttemptHistory({
  state,
}: Readonly<{
  state: Pick<UseGenerationState, "history" | "generation" | "navigateToGeneration">;
}>) {
  const [historyDesc, setHistoryDesc] = useState<GenerationDetailResponse[]>([]);
  const generation = state.generation;
  const hasShot = !!state.generation?.shot_id;
  const prevDisabled = !hasShot || generation?.attempt_num === 1;
  const nextDisabled = !hasShot || generation?.attempt_num === state.history.shotAttemptCount;
  const getAllGenerationsForShot = state.history.getAllGenerationsForShot;

  useEffect(() => {
    async function getHistory() {
      if (!generation?.shot_id) {
        setHistoryDesc([]);
        return;
      }
      const historyArr = await getAllGenerationsForShot();
      if (historyArr) {
        setHistoryDesc(historyArr.toSorted((a, b) => b.attempt_num - a.attempt_num));
      }
    }

    void getHistory();
  }, [generation?.shot_id, getAllGenerationsForShot]);

  function getIcon(gen: GenerationDetailResponse) {
    if (gen.id === generation?.id)
      return (
        <span className="flex w-6 justify-start">
          <Play data-icon="inline-start" className="size-3" />
        </span>
      );
    if (!gen.raw_review)
      return (
        <span className="flex w-6 justify-start">
          <Circle data-icon="inline-start" className="size-2.5" />
        </span>
      );
    return <span className="w-6" />;
  }

  function getLabel(gen: GenerationDetailResponse) {
    const output = gen.generation_assets.find((o) => o.assoc_type === "output");
    if (!output) return null;
    const ts = new Date(output.asset.file_timestamp);
    const formattedDate = formatDate(ts);
    return (
      <div className="flex gap-2">
        <span className="">{output.asset.file_name}</span>
        {" | "}
        <span className="">{formattedDate}</span>
      </div>
    );
  }

  async function gotoAttempt(direction: "next" | "prev") {
    const curAttempt = generation?.attempt_num;
    if (!curAttempt) return;
    let idxOffset = 0;

    switch (direction) {
      case "next": {
        if (curAttempt >= state.history.shotAttemptCount) return;
        idxOffset = -1;
        break;
      }
      case "prev": {
        if (curAttempt === 1) return;
        idxOffset = 1;
        break;
      }
    }
    // history array is sorted in desc order of attempt_num
    const curIdx = historyDesc.findIndex((h) => h.attempt_num === curAttempt);
    if (curIdx === -1) return;

    const dest = historyDesc[curIdx + idxOffset];
    if (!dest) return;

    await state.navigateToGeneration(dest.id);
  }

  function gotoNextAttempt() {
    void gotoAttempt("next");
  }

  function gotoPrevAttempt() {
    void gotoAttempt("prev");
  }

  return (
    <HoverCard>
      <div className="flex shrink-0 items-center text-muted-foreground bg-workspace/30 border border-border rounded-md">
        <Button disabled={prevDisabled} variant="ghost" size="lg" onClick={gotoPrevAttempt}>
          <ChevronLeft />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <HoverCardTrigger delay={100} closeDelay={500}>
          <Button disabled={!hasShot} className="mx-2" variant="ghost" size="lg">
            <History className="size-3" data-icon="inline-start" />
            Attempt {generation && generation.attempt_num > 0 ? generation.attempt_num : 0} /{" "}
            {state.history.shotAttemptCount}
          </Button>
        </HoverCardTrigger>
        <Button disabled={nextDisabled} variant="ghost" size="lg" onClick={gotoNextAttempt}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight />
        </Button>
      </div>

      <HoverCardContent
        side="top"
        className="w-fit ring-0 bg-transparent max-h-[80vh] max-w-[90vw] overflow-auto"
      >
        {!hasShot && <div>Select a shot to view the attempt history.</div>}
        {historyDesc.length > 0 && (
          <div className="bg-popover rounded-md border border-border p-2 text-accent-foreground/70">
            {historyDesc.map((h, i) => (
              <div
                key={h.id}
                className={cn(
                  "flex justify-start items-center",
                  "cursor-pointer",
                  "w-full py-2 px-2",
                  "hover:bg-muted",
                  "rounded-md",
                  i === historyDesc.length - 1 ? "" : "border-b ",
                )}
                onClick={() => void state.navigateToGeneration(h.id)}
              >
                {/* <Button variant="ghost" size="lg" className="w-full justify-start border-b"> */}
                {getIcon(h)}
                <div className="w-9"># {h.attempt_num}</div>
                <div>{getLabel(h)}</div>
              </div>
            ))}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
