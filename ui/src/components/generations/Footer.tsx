import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";

import AttemptHistory from "@/components/generations/footer/AttemptHistory";
import ManualLLM from "@/components/generations/footer/ManualLlm";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useNavHistory } from "@/context/NavHistoryContext";
import { cn } from "@/lib/utils";

export default function Footer({ state }: Readonly<{ state: UseGenerationState }>) {
  const navHistory = useNavHistory();
  return (
    <div
      className={cn(
        "flex items-center",
        "py-2 px-4 bg-card text-sm",
        "rounded-md border border-border",
      )}
    >
      <div className="flex flex-1 justify-start items-center gap-2">
        <Button
          variant="default"
          size="lg"
          disabled={!navHistory.hasPrev("/review-console/")}
          onClick={() => navHistory.goBack()}
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden md:inline">Previous Generation</span>
          <span className="inline md:hidden">Prev</span>
        </Button>
        <HoverCard>
          <HoverCardTrigger>
            <Button variant="ghost" size="icon" onClick={() => void state.refresh()}>
              <RefreshCcw data-icon="inline-start" className="size-4.5 text-muted-foreground" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent>Refresh</HoverCardContent>
        </HoverCard>
        <ManualLLM llmContext={state.llmContext} />
      </div>

      <AttemptHistory state={state} />

      <div className="flex flex-1 justify-end">
        <Button variant="default" size="lg" onClick={() => void state.navigateToNextPending()}>
          <span className="hidden md:inline">Next Pending Review</span>
          <span className="inline md:hidden">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
