/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

// At the API boundary, hand-rolled runtime validation (type guards, assertion functions
// or elaborate data classes) is assumed to be unnecessary boilerplate.
// The server is assumed to be the source of truth.
// If this assumption changes, we should:
//  - use axios instead of fetch (better typing)
//  - add zod (or similar) instead of maintaining custom validation.

import type { APIContract, RequestOptions } from "@/types/api";
import type { ValidationErrorResponse } from "@/types/api/error";

import { logger } from "@/lib/logger";

const BASE_URL = import.meta.env.API_BASE_URL ?? "http://localhost:8000";
const log = logger;
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    log.error({ type: "ApiError", message, status, body });
  }
}

async function parseErrorBody(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatValidationError(body: ValidationErrorResponse) {
  // FastAPI's 422 shape: { detail: [{ loc, msg, type }, ...] }
  if (body && Array.isArray(body.detail)) {
    return body.detail
      .map((item: ValidationErrorResponse["detail"]) => {
        const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join("; ");
  }
  return null;
}

/**
 * Core request helper. Throws ApiError on any non-2xx response with a
 * message derived from the response body when possible (FastAPI's
 * validation error shape is special-cased for readability).
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function request<T extends keyof APIContract>(
  path: string,
  options?: RequestOptions<T>,
): Promise<APIContract[T]["response"]> {
  const headers: HeadersInit = {};
  const opt = {
    method: "GET",
    body: undefined,
    isFormData: false,
    ...options,
  };

  let requestBody: BodyInit | undefined = opt.body;

  if (opt.body !== undefined && !opt.isFormData) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(opt.body);
  }

  if (opt.body !== undefined && opt.isFormData) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(opt.body)) {
      if (value === undefined || value === null) continue;

      if (value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        // objects already handled
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        formData.append(key, String(value));
      }
    }
    requestBody = formData;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: opt.method,
      headers,
      body: requestBody,
      signal: opt.signal,
    });
    log.api({
      state: "success",
      method: opt.method,
      path,
      request: { options, requestBody, headers },
      response,
    });
  } catch (networkError) {
    log.api({
      state: "network_error",
      method: opt.method,
      path,
      request: { options, requestBody, headers },
    });
    throw new ApiError(
      `Could not reach the API at ${BASE_URL}. Is the backend running?`,
      0,
      networkError,
    );
  }

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    const validationMessage = formatValidationError(errorBody as ValidationErrorResponse);
    const message: string =
      validationMessage ??
      errorBody?.detail ??
      errorBody?.message ??
      `Request failed with status ${response.status}`;
    log.api({
      state: "not_ok",
      method: opt.method,
      path,
      request: { options, requestBody, headers },
      response,
    });
    throw new ApiError(message, response.status, errorBody);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  log.api({
    state: "non_json_error",
    method: opt.method,
    path,
    request: { options, requestBody, headers },
    response,
  });

  throw new ApiError(
    `Expected JSON response but received '${contentType}'`,
    response.status,
    response.body,
  );
}

export function fileUrl(path: string) {
  return `${BASE_URL}${path}`;
}
