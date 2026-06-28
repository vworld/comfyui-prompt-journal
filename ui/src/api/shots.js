import { request } from './client';

/**
 * @typedef {Object} ShotSearchResult
 * @property {number} shot_id
 * @property {number|null} shot_number
 * @property {string} shot_name
 * @property {number} project_id
 * @property {string} project_name
 * @property {number} scene_id
 * @property {string} scene_name
 * @property {number} clip_id
 * @property {string} clip_name
 */

/**
 * Fuzzy search across the project/scene/clip/shot hierarchy.
 * @param {string} query
 * @param {number} [limit]
 * @returns {Promise<ShotSearchResult[]>}
 */
export function searchShots(query, limit = 20) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return request(`/api/shots/search?${params.toString()}`);
}

/**
 * Number of generation attempts already recorded for a shot.
 * @param {number} shotId
 * @returns {Promise<number>}
 */
export async function getShotGenerationCount(shotId) {
  const result = await request(`/api/shots/${shotId}/generations/count`);
  return result.count;
}
