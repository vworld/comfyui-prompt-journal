import type { GenerationAssetResponse, GenerationDetailResponse } from "@/types";

export function splitAssets(generationAssets: GenerationAssetResponse[]): {
  output: GenerationAssetResponse[];
  input: GenerationAssetResponse[];
} {
  const output = generationAssets.filter((a) => a.assoc_type === "output");
  const input = generationAssets.filter((a) => a.assoc_type === "input");
  return { output, input };
}

/**
 * Derives a coarse media kind from a MIME type.
 */
export function mediaKindFromMime(
  mimeType: string | null | undefined,
): "image" | "video" | "audio" | "unknown" {
  if (!mimeType) return "unknown";
  const [type] = mimeType.split("/");
  if (["image", "video", "audio"].includes(type)) return type as "image" | "video" | "audio";
  return "unknown";
}

/**
 * Assembles the CopyLLMContext payload from a generation plus whatever
 * the user currently has typed in the intent/review fields.
 */
export function buildLlmContext(
  generation: GenerationDetailResponse,
  liveValues?: {
    rawIntent?: string;
    rawReview?: string;
  },
): {
  generation_id: number;
  output_file_name: string | null;
  workflow_name: string | null;
  workflow_type: string | null;
  all_prompts: unknown[] | null;
  duration_seconds: number | null;
  fps: number | null;
  input_file_names: string[];
  raw_intent: string;
  raw_review: string;
} {
  const { output, input } = splitAssets(generation.generation_assets);

  return {
    generation_id: generation.id,
    output_file_name: output[0]?.asset?.file_name ?? null,
    workflow_name: generation.workflow_name ?? null,
    workflow_type: generation.workflow_type ?? null,
    all_prompts: generation.all_prompts_json?.map((p) => ({ role: p.role, text: p.text })) ?? [],
    duration_seconds: generation.duration_seconds ?? null,
    fps: generation.fps ?? null,
    input_file_names: input.map((a) => a.asset?.file_name).filter(Boolean),
    raw_intent: liveValues?.rawIntent ?? generation.raw_intent ?? "",
    raw_review: liveValues?.rawReview ?? generation.raw_review ?? "",
  };
}
