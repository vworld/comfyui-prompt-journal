import { request, fileUrl } from './client';

/**
 * Uploads a freshly-generated output file. The backend extracts metadata,
 * validates referenced input files, and creates a Generation row (with
 * shot_id left null until the user assigns one via updateManualReview).
 *
 * @param {File} file
 * @returns {Promise<GenerationDetailResponse>}
 */
export function uploadGeneration(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_last_modified', String(file.lastModified));
  formData.append('file_orig_name', file.name);

  return request('/api/uploads', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

/**
 * @param {number} id
 * @returns {Promise<GenerationDetailResponse>}
 */
export function getGeneration(id) {
  return request(`/api/generations/${id}`);
}

/**
 * Create-page submit: assigns a shot and records the human (raw) review.
 * shot_id is required by the backend schema.
 *
 * @param {number} id
 * @param {{ shot_id: number, raw_intent?: string, raw_review?: string, accepted?: boolean }} payload
 * @returns {Promise<GenerationDetailResponse>}
 */
export function updateManualReview(id, payload) {
  return request(`/api/generations/${id}/manual-review`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Review/update-page: records the LLM-enriched fields (and anything else
 * in the same payload shape). shot_id is still required by the schema
 * even though it's typically unchanged at this point.
 *
 * @param {number} id
 * @param {object} payload - shape of GenerationEnrichedReviewUpdateRequest
 * @returns {Promise<GenerationDetailResponse>}
 */
export function updateEnrichedReview(id, payload) {
  return request(`/api/generations/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

/**
 * Direct URL to the originally uploaded/archived output file's bytes.
 * Use as the src for <video>/<img> — no fetch needed, the browser loads
 * it directly (and FastAPI's FileResponse supports range requests, so
 * video scrubbing works without extra work).
 *
 * @param {number} assetId
 */
export function assetFileUrl(assetId) {
  return fileUrl(`/api/assets/${assetId}/file`);
}
