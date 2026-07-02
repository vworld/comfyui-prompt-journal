import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import type { AlertOptions, GenerationDetailResponse, GenerationUpdateRequest } from "@/types";

import { ApiError } from "@/api/client";
import {
  getGeneration,
  getLastUnreviewedGeneration,
  pullIntentFromPreviousAttempt,
  updateGeneration,
} from "@/api/generations";
import { getShotGenerationCount, listShotGenerations } from "@/api/shots";
import { buildLlmContext } from "@/api/transforms";
import { validateEnrichedReviewPayload } from "@/api/validation";
import { useAlert } from "@/context/AlertContext";
import { writeToClipboard } from "@/lib/clipboard";

export type UseGenerationState = ReturnType<typeof useGenerationState>;

function getApiErrorMessage(error: unknown, defaultError?: string): string {
  if (error instanceof ApiError) {
    return `${error.status}: ${error.message}`;
  }

  if (error instanceof Error) return error.message;

  return defaultError ?? "Unknown Error";
}

function generationIsDefined(
  generation: GenerationDetailResponse | null,
  setAlertError: (message: AlertOptions) => void,
  methodName: string,
): generation is GenerationDetailResponse {
  if (!generation) {
    setAlertError({
      title: "Unexpected Error",
      description: `${methodName}: GenerationId should have been defined.`,
    });
    return false;
  }
  return true;
}

function getAbortKey(payload: GenerationUpdateRequest): string {
  // eslint-disable-next-line unicorn/no-array-sort, unicorn/require-array-sort-compare, sonarjs/no-alphabetical-sort
  return Object.keys(payload).sort().join("|");
}

function validatePastedJson(json: unknown): string[] | null {
  const validation = validateEnrichedReviewPayload(json);
  if (!validation.valid) return validation.errors;
  return null;
}

// split fetch/save, intent+review, shot, llm-context into separate hooks before v2
export function useGenerationState() {
  const [generation, setGeneration] = useState<GenerationDetailResponse | null>(null);
  const [alertError, setAlertError] = useState<AlertOptions | null>(null);
  const [shotAttemptCount, setShotAttemptCount] = useState<number>(0);
  const draftIntentRef = useRef<string | null>(null);
  const draftReviewRef = useRef<string | null>(null);
  const lastSavedIntent = useRef<string | null>(null);
  const lastSavedReview = useRef<string | null>(null);
  const updateAbortControllerRef = useRef<Map<string, AbortController>>(new Map());
  const navigate = useNavigate();

  const alert = useAlert();

  function reset() {
    setGeneration(null);
    setShotAttemptCount(0);
  }

  useEffect(() => {
    if (!alertError) return;
    const error = alertError;
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect
    setAlertError(null);
    void alert.error(error);
  }, [alert, alertError]);

  const fetchGeneration = useCallback(
    async (genId: number, force?: boolean) => {
      try {
        if (Number.isNaN(genId) || genId < 1) {
          setAlertError({ title: "Invalid generation ID" });
          return;
        }

        if (!force && genId === generation?.id) return;

        const gen = await getGeneration(genId);

        const shotAttemptCount = gen.shot?.id ? await getShotGenerationCount(gen.shot.id) : 0;
        setGeneration(gen);
        setShotAttemptCount(shotAttemptCount);
        setAlertError(null);
        lastSavedIntent.current = gen.raw_intent ?? "";
        lastSavedReview.current = gen.raw_review ?? "";

        return gen;
      } catch (error) {
        const errMsg = getApiErrorMessage(error);
        reset();
        setAlertError({ title: `Error fetching generation`, description: errMsg });
      }
    },
    [generation?.id],
  );

  function getSignal(key: string): AbortSignal {
    updateAbortControllerRef.current.get(key)?.abort();
    const controller = new AbortController();
    updateAbortControllerRef.current.set(key, controller);

    return controller.signal;
  }

  const saveGenerationUpdates = useCallback(
    async (genId: number, payload: GenerationUpdateRequest) => {
      try {
        const reqKey = getAbortKey(payload);
        const abortSignal = getSignal(reqKey);
        await updateGeneration(genId, payload, abortSignal);
      } catch (error) {
        const msg = getApiErrorMessage(error);
        // eslint-disable-next-line preserve-caught-error
        throw new Error(msg);
      }
    },
    [],
  );

  const associateShotIdWithGeneration = useCallback(
    async (selectedShotId: number): Promise<boolean | undefined> => {
      if (!generationIsDefined(generation, setAlertError, "associateShotIdWithGeneration")) return;

      try {
        await saveGenerationUpdates(generation.id, { shot_id: selectedShotId });
        await fetchGeneration(generation.id, true);
        return true;
      } catch (error) {
        setAlertError({
          title: `Error associating Shot #${selectedShotId} with generation #${generation.id}`,
          description: error instanceof Error ? error.message : "Error!",
        });
        return false;
      }
    },
    [fetchGeneration, generation, saveGenerationUpdates],
  );

  const detachShotFromGeneration = useCallback(async () => {
    if (!generationIsDefined(generation, setAlertError, "detachShotFromGeneration")) return;
    const confirmed = await alert.confirm({
      title: "Remove the shot association from this generation?",
    });
    if (!confirmed) return;

    try {
      await saveGenerationUpdates(generation.id, { shot_id: null });

      await fetchGeneration(generation.id, true);
    } catch (error) {
      setAlertError({
        title: "Failed to detach shot from Generation",
        description: (error as Error).message,
      });
    }
  }, [alert, fetchGeneration, generation, saveGenerationUpdates]);

  const pullIntentFromLastAttempt = useCallback(
    async (curIntent: string | null): Promise<string | null | undefined> => {
      if (!generationIsDefined(generation, setAlertError, "pullIntentFromLastAttempt")) return;
      if (!generation.shot_id) {
        setAlertError({
          title: "No shot assigned to the generation",
          description: "Assign a shot to the generation before pulling the intent.",
        });
        return;
      }
      if (curIntent && curIntent.length > 0) {
        const confirmed = await alert.confirm({
          title: "This will overwrite the current intent. Continue?",
        });
        if (!confirmed) return;
      }
      try {
        const gen = await pullIntentFromPreviousAttempt(generation.id);
        toast.success("Intent pulled from previous attempt.");
        return gen.raw_intent;
      } catch (error) {
        const msg = getApiErrorMessage(error);
        setAlertError({ title: msg });
      }
    },
    [alert, generation],
  );

  const updateIntent = useCallback(
    async (intent: string | null) => {
      if (!generationIsDefined(generation, setAlertError, "updateIntent")) return;
      if (intent === lastSavedIntent.current) return;

      try {
        await saveGenerationUpdates(generation.id, { raw_intent: intent });
        lastSavedIntent.current = intent;
      } catch (error) {
        setAlertError({
          title: `Error updating intent to DB`,
          description: error instanceof Error ? error.message : "Error!",
        });
      }

      //
    },
    [generation, saveGenerationUpdates],
  );

  const updateReview = useCallback(
    async (review: string | null) => {
      if (!generationIsDefined(generation, setAlertError, "updateReview")) return;
      if (review === lastSavedReview.current) return;

      try {
        await saveGenerationUpdates(generation.id, { raw_review: review });
        lastSavedReview.current = review;
      } catch (error) {
        setAlertError({
          title: `Error updating review to DB`,
          description: error instanceof Error ? error.message : "Error!",
        });
      }
      //
    },
    [generation, saveGenerationUpdates],
  );

  const flush = useCallback(async () => {
    if (!generation) return;
    try {
      if (lastSavedIntent.current !== draftIntentRef.current) {
        await saveGenerationUpdates(generation.id, { raw_intent: draftIntentRef.current });
        lastSavedIntent.current = draftIntentRef.current;
      }
      if (lastSavedReview.current !== draftReviewRef.current) {
        await saveGenerationUpdates(generation.id, { raw_review: draftReviewRef.current });
        lastSavedReview.current = draftReviewRef.current;
      }
    } catch (error) {
      setAlertError({
        title: `Error flushing changes to DB`,
        description: error instanceof Error ? error.message : "Error!",
      });
    }
  }, [generation, saveGenerationUpdates]);

  const refresh = useCallback(
    async (skipToast = false) => {
      if (!generation) return;
      const refreshed = await fetchGeneration(generation.id, true);
      if (refreshed && !skipToast) toast.success("Generation refreshed.");
    },
    [fetchGeneration, generation],
  );

  const getLLMContext = useCallback(async () => {
    if (!generationIsDefined(generation, setAlertError, "updateReview")) return null;

    // ensure any inflight/pending changes are persisted
    await flush();

    // refetch generation from db
    const gen = await fetchGeneration(generation.id, true);

    // gen assumed defined: fetchGeneration only fails here if the server itself is down and server is local
    return buildLlmContext(gen!);
    //
  }, [fetchGeneration, flush, generation]);

  const copyLLMContext = useCallback(async () => {
    const context = await getLLMContext();
    await writeToClipboard(JSON.stringify(context), `LLM Context copied to clipboard`);

    //
  }, [getLLMContext]);

  const updateLLMResponse = useCallback(
    async (payload: unknown) => {
      const validated = validateEnrichedReviewPayload(payload);
      if (!validated.valid) {
        setAlertError({ title: `Validation Error`, description: validated.errors });
        return;
      }

      const { generation_id, ...data } = validated.validated;
      if (generation_id !== generation?.id) {
        const confirmed = await alert.confirm({
          title: `Importing to a different generation`,
          description:
            `Current open generation (${generation?.id}) does not match ` +
            `the one (${generation_id}) to which the response is being imported. Proceed?`,
        });
        if (!confirmed) return;
      }

      try {
        await saveGenerationUpdates(generation_id, data);
      } catch (error) {
        setAlertError({
          title: `Error importing to DB`,
          description: error instanceof Error ? error.message : "Error!",
        });
      }
    },
    [alert, generation?.id, saveGenerationUpdates],
  );

  const getAllGenerationsForShot = useCallback(async () => {
    const shotId = generation?.shot_id;
    if (!shotId) return;
    try {
      // this returns too big a response, optimize
      return await listShotGenerations(shotId);
    } catch (error) {
      const msg = getApiErrorMessage(error);
      toast.error(`Error fetching shot attempts: ${msg}`);
    }
  }, [generation?.shot_id]);

  const navigateToGeneration = useCallback(
    async (genId: number) => {
      await flush();
      await navigate(`/review-console/${genId}`);
    },
    [flush, navigate],
  );

  const navigateToNextPending = useCallback(async () => {
    await flush();
    const nextPendingResponse = await getLastUnreviewedGeneration(generation?.id);
    const nextId = nextPendingResponse[0];
    if (nextId) {
      await navigate(`/review-console/${nextId}`);
    } else {
      await navigate("/");
    }
  }, [flush, generation?.id, navigate]);

  return {
    generation,
    fetchGeneration,
    alertError,
    shot: { associateShotIdWithGeneration, detachShotFromGeneration },
    manualReview: {
      pullIntentFromLastAttempt,
      draftIntentRef,
      draftReviewRef,
      updateIntent,
      updateReview,
    },
    llmContext: {
      getLLMContext,
      copyLLMContext,
      validatePastedJson,
      updateLLMResponse,
    },
    history: {
      shotAttemptCount,
      getAllGenerationsForShot,
    },
    flush,
    refresh,
    navigateToGeneration,
    navigateToNextPending,
  };
}
