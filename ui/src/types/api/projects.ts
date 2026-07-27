import type { DuplicateValidationResponse } from "@/types/api/base";

export interface ProjectCreateRequest {
  name: string;
  /**
   * Hints to be provided
   *  - Long Video
   *  - Short Video
   *  - Images
   *  - Experiments
   * The hints should be provided as a dropdown, but user is free to use anything
   */
  project_type: string;
  description?: string | null;
}

export interface ProjectUpdateRequest {
  name?: string | null;
  project_type?: string | null;
  description?: string | null;
}

export interface ProjectResponse {
  id: number;
  name: string;
  project_type: string;
  description: string | null;
  added_on: number;
}

export type ProjectNameValidationResponse = DuplicateValidationResponse<ProjectResponse>;

export interface PathItem {
  kind: "project" | "scene" | "clip" | "shot" | "generation";
  id: number;
}

export interface ProjectPathResponse {
  path: PathItem[];
}
