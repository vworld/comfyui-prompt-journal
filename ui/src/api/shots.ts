import { request } from "./client";

import type { ShotSearchResult } from "@/types";

export function searchShots(
  query: string,
  limit = 20,
  abortSignal?: AbortSignal,
): Promise<ShotSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return request<"searchShots">(`/api/shots/search?${params.toString()}`, { signal: abortSignal });
}

/**
 * Number of generation attempts already recorded for a shot.
 */
export async function getShotGenerationCount(
  shotId: number,
  abortSignal?: AbortSignal,
): Promise<number> {
  const result = await request<"getShotGenerationCount">(`/api/shots/${shotId}/generations/count`, {
    signal: abortSignal,
  });
  return result.count;
}

export function listShotGenerations(shotId: number, signal?: AbortSignal) {
  return request<"listShotGenerations">(`/api/shots/${shotId}/generations`, { signal });
}
