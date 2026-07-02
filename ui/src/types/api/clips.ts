import type { SceneHierarchicalResponse } from "./scenes";
import type { DuplicateValidationResponse } from "@/types/api/base";

export interface ClipCreateRequest {
  number?: number | null;
  name: string;
  description?: string | null;
  comments?: string | null;
}

export interface ClipUpdateRequest {
  number?: number | null;
  name?: string | null;
  description?: string | null;
  comments?: string | null;
}

export interface ClipResponse {
  id: number;
  scene_id: number;
  number: number | null;
  name: string;
  description: string | null;
  comments: string | null;
  added_on: number;
}

export interface ClipHierarchicalResponse extends ClipResponse {
  scene: SceneHierarchicalResponse;
}

export type ClipValidationResponse = DuplicateValidationResponse<ClipResponse>;
