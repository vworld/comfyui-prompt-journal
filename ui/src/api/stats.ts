import type { CurrentStatsResponse } from "@/types";

import { request } from "@/api/client";

export function getStats(signal?: AbortSignal): Promise<CurrentStatsResponse> {
  return request<"getStats">(`/api/stats`, { signal });
}
