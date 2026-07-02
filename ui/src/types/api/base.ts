// ============================================================
// Base / Metadata Types (from app/schemas/types/metadata.py)
// ============================================================

export type WorkflowType =
  | "text-to-image"
  | "multi-ref-image"
  | "image-to-image"
  | "video-to-video"
  | "multi-ref-image-to-video"
  | "image-and-audio-to-video"
  | "image-to-video"
  | "audio-to-video"
  | "text-to-video"
  | "text-to-audio"
  | "conditioned-audio"
  | "unknown";

export type OutputFileRole = "output_asset" | "output_video" | "output_image";

export type InputFileRole =
  | "first_frame"
  | "last_frame"
  | "reference_image"
  | "depth_map"
  | "control_image"
  | "mask"
  | "audio"
  | "video"
  | "input_image"
  | "other";

export interface PromptUsed {
  node_id: string;
  title: string | null;
  role: string;
  text: string | null;
}

export interface ModelUsedInfo {
  node_id: string;
  class_type: string | null;
  title: string | null;
  role: string;
  name: string | null;
  strength_model?: number;
  strength_clip?: number;
  strength?: number;
}

export interface DuplicateValidationResponse<T> {
  is_unique: boolean;
  duplicate: T | null;
}

export interface NextAvailableNumberResponse {
  next_number: number;
  max_number: number | null;
}
