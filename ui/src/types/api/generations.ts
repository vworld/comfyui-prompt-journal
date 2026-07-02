import type { AssetResponse } from "./assets";
import type { ModelUsedInfo, PromptUsed } from "./base";
import type { ShotHierarchicalResponse } from "./shots";

export interface GenerationAssetResponse {
  assoc_type: "output" | "input";
  role: string;
  asset: AssetResponse;
}

export interface GenerationSummaryResponse {
  id: number;
  project_id: number | null;
  shot_id: number | null;
  /** -1 would exist for generations which do not have a shot assigned to it */
  attempt_num: number;
  workflow_name: string | null;
  workflow_id: string | null;
  workflow_type: string | null;
  generation_time_seconds: number | null;
  seed: number | null;
  requested_width: number | null;
  requested_height: number | null;
  output_width: number | null;
  output_height: number | null;
  fps: number | null;
  frame_count: number | null;
  duration_seconds: number | null;
  sampler: string | null;
  scheduler: string | null;
  steps: number | null;
  cfg: number | null;
  primary_model_name: string | null;
  models_json: ModelUsedInfo[] | null;
  prompt: string | null;
  negative_prompt: string | null;
  all_prompts_json: PromptUsed[] | null;
  input_files_count: number | null;
  raw_intent: string | null;
  raw_review: string | null;
  cleaned_intent: string | null;
  cleaned_review: string | null;
  failure_description: string | null;
  suspected_causes: string | null;
  correction_strategy: string | null;
  accepted: boolean;
  added_on: number;
}

export interface GenerationDetailResponse extends GenerationSummaryResponse {
  shot: ShotHierarchicalResponse | null;
  generation_assets: GenerationAssetResponse[];
}

export interface GenerationManualReviewUpdateRequest {
  shot_id?: number | null;
  raw_intent?: string | null;
  raw_review?: string | null;
  accepted?: boolean | null;
}

interface GenerationEnrichedImportFields {
  cleaned_intent?: string | null;
  cleaned_review?: string | null;
  failure_description?: string | null;
  suspected_causes?: string | null;
  correction_strategy?: string | null;
}

export type GenerationUpdateRequest = GenerationManualReviewUpdateRequest &
  GenerationEnrichedImportFields;

export interface GenerationEnrichedImportRequest extends GenerationEnrichedImportFields {
  generation_id: number;
}
