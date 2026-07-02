import type { ClipHierarchicalResponse } from "./clips";
import type { DuplicateValidationResponse } from "@/types/api/base";

export interface ShotCreateRequest {
  number?: number | null;
  name: string;
  description?: string | null;
  comments?: string | null;
}

export interface ShotUpdateRequest {
  number?: number | null;
  name?: string | null;
  description?: string | null;
  comments?: string | null;
}

export interface ShotResponse {
  id: number;
  project_id: number;
  scene_id: number;
  clip_id: number;
  number: number | null;
  name: string;
  description: string | null;
  comments: string | null;
  added_on: number;
}

export interface ShotGenerationCountResponse {
  count: number;
}

export interface ShotSearchResult {
  shot_id: number;
  shot_number: number | null;
  shot_name: string;
  project_id: number;
  project_name: string;
  scene_id: number;
  scene_name: string;
  clip_id: number;
  clip_name: string;
}

export interface ShotHierarchicalResponse extends ShotResponse {
  clip: ClipHierarchicalResponse;
}

export type ShotValidationResponse = DuplicateValidationResponse<ShotResponse>;
