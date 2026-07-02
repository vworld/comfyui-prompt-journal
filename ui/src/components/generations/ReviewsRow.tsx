import { BetweenHorizontalStart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { UseGenerationState } from "@/components/generations/use-generation-state";
import type { GenerationDetailResponse } from "@/types";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function ReviewsRow({
  generation,
  manualReview,
}: Readonly<{
  generation: Pick<GenerationDetailResponse, "raw_intent" | "raw_review" | "shot_id">;
  manualReview: UseGenerationState["manualReview"];
}>) {
  const [intent, setIntent] = useState<string>(generation.raw_intent ?? "");
  const [review, setReview] = useState<string>(generation.raw_review ?? "");
  const [loadingPrevIntent, setLoadingPrevIntent] = useState(false);

  const intentDebounced = useDebounce();
  const reviewDebounced = useDebounce();

  const { draftReviewRef, draftIntentRef, updateIntent, updateReview, pullIntentFromLastAttempt } =
    manualReview;

  async function pullIntentFromLast() {
    setLoadingPrevIntent(true);
    const lastIntent = await pullIntentFromLastAttempt(intent);
    if (lastIntent) {
      draftIntentRef.current = lastIntent;
      setIntent(lastIntent);
    }
    setLoadingPrevIntent(false);
  }

  const setDraftIntent = useCallback(
    (value: string) => {
      draftIntentRef.current = value;
      setIntent(value);
    },
    [draftIntentRef],
  );

  const setDraftReview = useCallback(
    (value: string) => {
      draftReviewRef.current = value;
      setReview(value);
    },
    [draftReviewRef],
  );

  useEffect(() => {
    intentDebounced.debounce(() => updateIntent(intent), 800);
  }, [intent, intentDebounced, updateIntent]);

  useEffect(() => {
    reviewDebounced.debounce(() => updateReview(review), 800);
  }, [review, reviewDebounced, updateReview]);

  useEffect(() => {
    const intent = generation.raw_intent ?? "";
    draftIntentRef.current = intent;
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect
    setIntent(intent);

    const review = generation.raw_review ?? "";
    draftReviewRef.current = review;
    // eslint-disable-next-line react-x/set-state-in-effect
    setReview(review);
  }, [draftIntentRef, draftReviewRef, generation.raw_intent, generation.raw_review]);

  return (
    <div className="flex items-center gap-2">
      <div className="w-1/2 bg-card rounded-md px-2 border border-border">
        <Field>
          <FieldLabel
            className={cn(
              "flex items-center justify-between",
              "px-2 pt-2 font-mono text-tiny uppercase tracking-wide text-muted-foreground",
            )}
          >
            <span>Intent</span>
            <HoverCard>
              <HoverCardTrigger delay={100}>
                <Button
                  disabled={!generation.shot_id}
                  variant="ghost"
                  size="xs"
                  onClick={() => void pullIntentFromLast()}
                >
                  <BetweenHorizontalStart className="size-3.5" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="center">
                <div>Pull intent from the previous attempt.</div>
                <div>For this to work, shot should have selected.</div>
              </HoverCardContent>
            </HoverCard>
          </FieldLabel>

          <Textarea
            value={intent}
            disabled={loadingPrevIntent}
            placeholder="Add intent or pull from previous attempt."
            onChange={(e) => setDraftIntent(e.target.value)}
            className="dark:bg-workspace border-transparent h-25 no-scrollbar font-mono resize"
          >
            {intent}
          </Textarea>
        </Field>
      </div>
      <div className="w-1/2 bg-card rounded-md px-2 border border-border">
        <Field>
          <FieldLabel
            className={cn(
              "flex items-center justify-between",
              "px-2 pt-2 h-8 font-mono text-tiny uppercase tracking-wide text-muted-foreground",
            )}
          >
            <span>Review</span>
            {/* <Button variant="ghost" size="xs">
              <BetweenHorizontalStart className="size-3.5" />
            </Button> */}
          </FieldLabel>

          <Textarea
            value={review}
            onChange={(e) => setDraftReview(e.target.value)}
            className="dark:bg-workspace border-transparent h-25 no-scrollbar font-mono resize"
            placeholder="Add review. Describe what went wrong and what is right"
          >
            {generation.raw_intent}
          </Textarea>
        </Field>
      </div>
    </div>
  );
}
