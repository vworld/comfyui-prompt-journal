const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseErrorBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function formatValidationError(body) {
  // FastAPI's 422 shape: { detail: [{ loc, msg, type }, ...] }
  if (body && Array.isArray(body.detail)) {
    return body.detail
      .map((item) => {
        const field = Array.isArray(item.loc)
          ? item.loc.slice(1).join(".")
          : "";
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
export async function request(
  path,
  { method = "GET", body, isFormData = false, signal } = {},
) {
  const headers = {};
  let requestBody = body;

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: requestBody,
      signal,
    });
  } catch (networkError) {
    throw new ApiError(
      `Could not reach the API at ${BASE_URL}. Is the backend running?`,
      0,
      networkError,
    );
  }

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);
    const validationMessage = formatValidationError(errorBody);
    const message =
      validationMessage ||
      errorBody?.detail ||
      errorBody?.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorBody);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response;
}

export function fileUrl(path) {
  return `${BASE_URL}${path}`;
}
