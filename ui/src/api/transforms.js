/**
 * Splits a generation's assets into output vs input, based on assoc_type.
 * @param {GenerationDetailResponse} generation
 */
export function splitAssets(generation) {
  const assets = generation?.generation_assets ?? [];
  const output = assets.filter((a) => a.assoc_type === 'output');
  const input = assets.filter((a) => a.assoc_type === 'input');
  return { output, input };
}

/**
 * Derives a coarse media kind from a MIME type. Falls back to 'unknown'
 * (rendered as a generic file tile) rather than guessing from the
 * filename extension, since mime_type is the authoritative signal the
 * backend now provides on every Asset.
 * @param {string|null|undefined} mimeType
 * @returns {'image'|'video'|'audio'|'unknown'}
 */
export function mediaKindFromMime(mimeType) {
  if (!mimeType) return 'unknown';
  const [type] = mimeType.split('/');
  if (type === 'image' || type === 'video' || type === 'audio') return type;
  return 'unknown';
}

/**
 * Assembles the CopyLLMContext payload from a generation plus whatever
 * the user currently has typed in the intent/review fields (these may
 * not be saved yet, so we prefer the live in-memory values when given).
 *
 * @param {GenerationDetailResponse} generation
 * @param {{ rawIntent?: string, rawReview?: string }} [liveValues]
 */
export function buildLlmContext(generation, liveValues = {}) {
  const { output, input } = splitAssets(generation);

  return {
    generation_id: generation.id,
    output_file_name: output[0]?.asset?.file_name ?? null,
    workflow_name: generation.workflow_name ?? null,
    workflow_type: generation.workflow_type ?? null,
    all_prompts: generation.all_prompts_json ?? [],
    duration_seconds: generation.duration_seconds ?? null,
    fps: generation.fps ?? null,
    input_file_names: input.map((a) => a.asset?.file_name).filter(Boolean),
    raw_intent: liveValues.rawIntent ?? generation.raw_intent ?? '',
    raw_review: liveValues.rawReview ?? generation.raw_review ?? '',
  };
}
