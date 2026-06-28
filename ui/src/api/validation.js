const OPTIONAL_STRING_FIELDS = [
  'raw_intent',
  'raw_review',
  'cleaned_intent',
  'cleaned_review',
  'failure_description',
  'suspected_causes',
  'correction_strategy',
];

const KNOWN_FIELDS = new Set(['shot_id', 'accepted', ...OPTIONAL_STRING_FIELDS]);

/**
 * Validates a parsed object against GenerationEnrichedReviewUpdateRequest's
 * shape exactly (strict — no auto-coercion). Returns { valid, errors }.
 */
export function validateEnrichedReviewPayload(payload) {
  const errors = [];

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { valid: false, errors: ['Expected a JSON object, not an array or primitive value.'] };
  }

  if (!('shot_id' in payload)) {
    errors.push('"shot_id" is required.');
  } else if (!Number.isInteger(payload.shot_id)) {
    errors.push('"shot_id" must be an integer.');
  }

  if ('accepted' in payload && payload.accepted !== null && typeof payload.accepted !== 'boolean') {
    errors.push('"accepted" must be a boolean or null.');
  }

  for (const field of OPTIONAL_STRING_FIELDS) {
    if (field in payload && payload[field] !== null && typeof payload[field] !== 'string') {
      errors.push(`"${field}" must be a string or null.`);
    }
  }

  const unknownFields = Object.keys(payload).filter((key) => !KNOWN_FIELDS.has(key));
  if (unknownFields.length > 0) {
    errors.push(`Unrecognized field(s): ${unknownFields.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Strictly parses a string as JSON — no fence-stripping, no tolerance for
 * leading/trailing prose, per the explicit decision to fail loudly on
 * malformed input rather than guess at the user's intent.
 */
export function parseStrictJson(text) {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (err) {
    return { value: null, error: err.message };
  }
}
