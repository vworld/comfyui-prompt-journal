import type { GenerationEnrichedImportRequest } from "@/types";

export function validateEnrichedReviewPayload(payload: unknown):
  | {
      valid: true;
      validated: GenerationEnrichedImportRequest;
    }
  | { valid: false; errors: string[] } {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { valid: false, errors: ["Expected a JSON object, not an array or primitive value."] };
  }

  const errors: string[] = [];

  const obj = payload as Record<string, unknown>;
  if (!("generation_id" in obj) || typeof obj.generation_id !== "number") {
    errors.push('"generation_id" must be a number.');
  }

  if ("accepted" in obj && obj.accepted !== null && typeof obj.accepted !== "boolean") {
    errors.push('"accepted" must be a boolean or null.');
  }

  const optionalStringFields = [
    "cleaned_intent",
    "cleaned_review",
    "failure_description",
    "suspected_causes",
    "correction_strategy",
  ];

  for (const field of optionalStringFields) {
    if (Object.hasOwn(obj, field) && obj[field] !== null && typeof obj[field] !== "string") {
      errors.push(`"${field}" must be a string or null.`);
    }
  }

  const knownFields = new Set(["generation_id", "accepted", ...optionalStringFields]);

  const unknownFields = Object.keys(obj).filter((key) => !knownFields.has(key));
  if (unknownFields.length > 0) {
    errors.push(`Unrecognized field(s): ${unknownFields.join(", ")}`);
  }

  return errors.length === 0
    ? { valid: true, validated: payload as GenerationEnrichedImportRequest }
    : { valid: false, errors };
}

/**
 * Strictly parses a string as JSON — no fence-stripping, no tolerance for
 * leading/trailing prose, per the explicit decision to fail loudly on
 * malformed input rather than guess at the user's intent.
 */
export function parseStrictJson(text: string): {
  value: unknown;
  error: string | null;
} {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error: (error as Error).message };
  }
}
