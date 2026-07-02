export interface ValidationErrorResponse {
  detail: {
    /**
     * Path to the field that failed validation.
     *
     * Example:
     * ["body", "name"]
     * ["body", "items", 0, "title"]
     */
    loc: (string | number)[];

    /**
     * Human-readable error message.
     */
    msg: string;

    /**
     * Pydantic error type.
     *
     * Example:
     * "missing"
     * "string_too_short"
     * "greater_than"
     */
    type: string;

    /**
     * The offending input value.
     */
    input?: unknown;

    /**
     * Additional context supplied by Pydantic.
     */
    ctx?: Record<string, unknown>;
  };
}
