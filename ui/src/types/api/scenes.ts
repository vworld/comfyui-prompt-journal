import type { ProjectResponse } from "./projects";
import type { DuplicateValidationResponse } from "@/types/api/base";

export interface SceneCreateRequest {
  number?: number | null;
  name: string;
  description?: string | null;
  comments?: string | null;
}

export interface SceneUpdateRequest {
  number?: number | null;
  name?: string | null;
  description?: string | null;
  comments?: string | null;
}

export interface SceneResponse {
  id: number;
  project_id: number;
  number: number | null;
  name: string;
  description: string | null;
  comments: string | null;
  added_on: number;
}

export interface SceneHierarchicalResponse extends SceneResponse {
  project: ProjectResponse;
}

export type SceneValidationResponse = DuplicateValidationResponse<SceneResponse>;
