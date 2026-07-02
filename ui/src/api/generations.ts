import { fileUrl, request } from "./client";

import type {
  GenerationDetailResponse,
  GenerationManualReviewUpdateRequest,
  GenerationSummaryResponse,
  GenerationUpdateRequest,
  RecreateAssetFromArchiveResponse,
} from "@/types";

/**
 * Uploads a freshly-generated output file. The backend extracts metadata,
 * validates referenced input files, and creates a Generation row (with
 * shot_id left null until the user assigns one via updateManualReview).
 */
export function uploadGeneration(file: File): Promise<GenerationDetailResponse> {
  const body = {
    file: file,
    file_last_modified: file.lastModified,
    file_orig_name: file.name,
  };

  return request<"uploadGeneratedFile">("/api/uploads", {
    method: "POST",
    body: body,
    isFormData: true,
  });
}

export function getGeneration(id: number): Promise<GenerationDetailResponse> {
  return request<"getGenerationById">(`/api/generations/${id}`);
}

export function getLastUnreviewedGeneration(curGenId?: number | null) {
  const params = new URLSearchParams({
    orderBy: "generation_time",
    orderDirection: "desc",
    limit: "1",
  });
  if (curGenId) params.append("cursor_generation_id", curGenId.toString());
  return request<"listUnreviewedGenerationIds">(`/api/generations/unreviewed?${params.toString()}`);
}

/**
 * Create-page submit: assigns a shot and records the human (raw) review.
 * shot_id is required by the backend schema.
 *
 * @deprecated
 */
export function updateManualReview(
  id: number,
  payload: GenerationManualReviewUpdateRequest,
): Promise<GenerationDetailResponse> {
  return request<"updateGenerationManualReview">(`/api/generations/${id}/manual-review`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Review/update-page: records the LLM-enriched fields (and anything else
 * in the same payload shape). shot_id is still required by the schema
 * even though it's typically unchanged at this point.
 */
export function updateGeneration(
  id: number,
  payload: GenerationUpdateRequest,
  abortSignal?: AbortSignal,
) {
  return request<"updateGeneration">(`/api/generations/${id}`, {
    method: "PATCH",
    body: payload,
    signal: abortSignal,
  });
}

export function pullIntentFromPreviousAttempt(
  genId: number,
  signal?: AbortSignal,
): Promise<GenerationSummaryResponse> {
  return request<"pullIntentFromPreviousAttempt">(
    `/api/generations/${genId}/pull-intent-from-previous-attempt`,
    { method: "POST", signal },
  );
}

/**
 * Direct URL to the originally uploaded/archived output file's bytes.
 * Use as the src for <video>/<img> — no fetch needed, the browser loads
 * it directly (and FastAPI's FileResponse supports range requests, so
 * video scrubbing works without extra work).
 *
 * @param {number} assetId
 */
export function assetFileUrl(assetId: number) {
  return fileUrl(`/api/assets/${assetId}/file`);
}

export function recreateAssetFromArchive(
  assetId: number,
): Promise<RecreateAssetFromArchiveResponse> {
  return request<"recreateAssetFromArchive">(`/api/assets/${assetId}/recreate-from-archive`);
}
