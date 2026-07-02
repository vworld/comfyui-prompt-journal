import type { FormattedPrompt, GenerationDetailResponse } from "@/types";

export function formatPrompts(generation: GenerationDetailResponse): FormattedPrompt[] {
  const prompts = generation.all_prompts_json;

  if (Array.isArray(prompts) && prompts.length > 0) {
    const promptsArr = prompts
      .filter((p): p is typeof p & { text: string } => typeof p.text === "string")
      .map((p) => ({
        tag: `${p.title}: ${p.role}`,
        text: p.text,
        tone: ["negative", "positive"].includes(p.role) ? p.role : undefined,
      }));
    promptsArr.sort((a, b) => Number(b.tone === "positive") - Number(a.tone === "positive"));
  }
  // Fallback for older/simpler generations with only prompt/negative_prompt set.
  const fallback: FormattedPrompt[] = [];
  if (generation.prompt)
    fallback.push({ tag: "Positive", text: generation.prompt, tone: "positive" });
  if (generation.negative_prompt)
    fallback.push({ tag: "Negative", text: generation.negative_prompt, tone: "negative" });
  return fallback;
}
