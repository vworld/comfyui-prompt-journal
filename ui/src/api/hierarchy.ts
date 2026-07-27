import { request } from "./client";

import type {
  ClipCreateRequest,
  ClipResponse,
  ClipUpdateRequest,
  ClipValidationResponse,
  GenerationDetailResponse,
  NextAvailableNumberResponse,
  ProjectCreateRequest,
  ProjectNameValidationResponse,
  ProjectPathResponse,
  ProjectResponse,
  ProjectUpdateRequest,
  SceneCreateRequest,
  SceneResponse,
  SceneUpdateRequest,
  SceneValidationResponse,
  ShotCreateRequest,
  ShotResponse,
  ShotUpdateRequest,
  ShotValidationResponse,
} from "@/types";

export interface SceneNameOptions {
  projectId: number;
  name: string;
  abortSignal?: AbortSignal;
}

export interface SceneNumberOptions {
  projectId: number;
  number: number;
  abortSignal?: AbortSignal;
}

export interface ClipNameOptions {
  sceneId: number;
  name: string;
  abortSignal?: AbortSignal;
}

export interface ClipNumberOptions {
  sceneId: number;
  number: number;
  abortSignal?: AbortSignal;
}

export interface ShotNameOptions {
  clipId: number;
  name: string;
  abortSignal?: AbortSignal;
}

export interface ShotNumberOptions {
  clipId: number;
  number: number;
  abortSignal?: AbortSignal;
}

export interface NextSceneNumberOptions {
  projectId: number;
  abortSignal?: AbortSignal;
}

export interface NextClipNumberOptions {
  sceneId: number;
  abortSignal?: AbortSignal;
}

export interface NextShotNumberOptions {
  clipId: number;
  abortSignal?: AbortSignal;
}

export interface FindProjectIdOptions {
  entity: "scene" | "clip" | "shot" | "generation";
  id: number;
  abortSignal?: AbortSignal;
}

/**
 * List every project.
 */
export function listProjects(abortSignal?: AbortSignal): Promise<ProjectResponse[]> {
  return request<"listProjects">(`/api/projects`, {
    signal: abortSignal,
  });
}

export function getProjectById(id: number, abortSignal?: AbortSignal): Promise<ProjectResponse> {
  return request<"getProjectById">(`/api/projects/${id}`, {
    signal: abortSignal,
  });
}

export function updateProject(
  id: number,
  payload: ProjectUpdateRequest,
  abortSignal?: AbortSignal,
): Promise<ProjectResponse> {
  return request<"updateProjectById">(`/api/projects/${id}`, {
    method: "PATCH",
    body: payload,
    signal: abortSignal,
  });
}

export function deleteProject(id: number, abortSignal?: AbortSignal): Promise<null> {
  return request<"deleteProjectById">(`/api/projects/${id}`, {
    method: "DELETE",
    signal: abortSignal,
  });
}

/**
 * Search projects by name. Pass an empty query to list/recent projects.
 */
export function searchProjects({
  query,
  limit = 10,
  abortSignal,
}: {
  query: string;
  limit?: number;
  abortSignal?: AbortSignal;
}): Promise<ProjectResponse[]> {
  const params = new URLSearchParams();

  params.set("q", query);

  params.set("limit", limit.toString());
  return request<"searchProjects">(`/api/projects/search?${params.toString()}`, {
    signal: abortSignal,
  });
}

/**
 * Validate that a project name is unique.
 */
export async function validateProjectName({
  name,
  abortSignal,
}: {
  name: string;
  abortSignal?: AbortSignal;
}): Promise<ProjectNameValidationResponse> {
  const params = new URLSearchParams();
  params.set("name", name);
  return request<"validateProjectName">(
    `/api/projects/validate/project-name?${params.toString()}`,
    { signal: abortSignal },
  );
}

/**
 * Promise to support DB queries
 */
export function getProjectTypes() {
  return Promise.resolve(["Long Video", "Short Video", "Images", "Experiments", "default"]);
}

/**
 * Resolve the path to project ID from any descendant resource.
 */
export function findPathToProjectId({
  entity,
  id,
  abortSignal,
}: FindProjectIdOptions): Promise<ProjectPathResponse> {
  const params = new URLSearchParams();
  let field: string | undefined;
  switch (entity) {
    case "scene": {
      field = "scene_id";
      break;
    }
    case "clip": {
      field = "clip_id";
      break;
    }
    case "shot": {
      field = "shot_id";
      break;
    }
    case "generation": {
      field = "generation_id";
      break;
    }
  }
  if (!field) throw new Error("One of the entities is required");

  params.set(field, id.toString());

  return request<"findPathToProjectId">(
    `/api/projects/find-path-to-project-id?${params.toString()}`,
    {
      signal: abortSignal,
    },
  );
}

/**
 * Create a project with detailed fields.
 */
export function createProject({
  payload,
  abortSignal,
}: {
  payload: ProjectCreateRequest;
  abortSignal?: AbortSignal;
}): Promise<ProjectResponse> {
  return request<"createProject">(`/api/projects`, {
    method: "POST",
    body: payload,
    signal: abortSignal,
  });
}

export async function searchScenes({
  projectId,
  query,
  limit = 10,
  abortSignal,
}: {
  projectId: number;
  query: string;
  limit?: number;
  abortSignal?: AbortSignal;
}): Promise<SceneResponse[]> {
  const params = new URLSearchParams();
  params.set("q", query);

  params.set("limit", limit.toString());

  return request<"searchSceneInProject">(
    `/api/projects/${projectId}/scenes/search?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function createScene({
  projectId,
  payload,
  abortSignal,
}: {
  projectId: number;
  payload: SceneCreateRequest;
  abortSignal?: AbortSignal;
}): Promise<SceneResponse> {
  return request<"createProjectScene">(`/api/projects/${projectId}/scenes`, {
    method: "POST",
    body: payload,
    signal: abortSignal,
  });
}

export async function searchClip({
  sceneId,
  query,
  limit = 10,
  abortSignal,
}: {
  sceneId: number;
  query: string;
  limit?: number;
  abortSignal?: AbortSignal;
}) {
  const params = new URLSearchParams();

  params.set("q", query);
  params.set("limit", limit.toString());

  return request<"searchClipInScene">(`/api/scenes/${sceneId}/clips/search?${params.toString()}`, {
    signal: abortSignal,
  });
}

export async function createClip({
  sceneId,
  payload,
  abortSignal,
}: {
  sceneId: number;
  payload: ClipCreateRequest;
  abortSignal?: AbortSignal;
}): Promise<ClipResponse> {
  return request<"createSceneClip">(`/api/scenes/${sceneId}/clips`, {
    method: "POST",
    body: payload,
    signal: abortSignal,
  });
}

export async function validateSceneName({
  projectId,
  name,
  abortSignal,
}: SceneNameOptions): Promise<SceneValidationResponse> {
  const params = new URLSearchParams();
  params.set("name", name);
  return request<"validateSceneName">(
    `/api/projects/${projectId}/scenes/validate/scene-name?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function validateSceneNumber({
  projectId,
  number,
  abortSignal,
}: SceneNumberOptions): Promise<SceneValidationResponse> {
  const params = new URLSearchParams();
  params.set("number", number.toString());
  return request<"validateSceneNumber">(
    `/api/projects/${projectId}/scenes/validate/scene-number?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function validateClipName({
  sceneId,
  name,
  abortSignal,
}: ClipNameOptions): Promise<ClipValidationResponse> {
  const params = new URLSearchParams();
  params.set("name", name);
  return request<"validateClipName">(
    `/api/scenes/${sceneId}/clips/validate/clip-name?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function validateClipNumber({
  sceneId,
  number,
  abortSignal,
}: ClipNumberOptions): Promise<ClipValidationResponse> {
  const params = new URLSearchParams();
  params.set("number", number.toString());
  return request<"validateClipNumber">(
    `/api/scenes/${sceneId}/clips/validate/clip-number?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function validateShotName({
  clipId,
  name,
  abortSignal,
}: ShotNameOptions): Promise<ShotValidationResponse> {
  const params = new URLSearchParams();
  params.set("name", name);
  return request<"validateShotName">(
    `/api/clips/${clipId}/shots/validate/shot-name?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function validateShotNumber({
  clipId,
  number,
  abortSignal,
}: ShotNumberOptions): Promise<ShotValidationResponse> {
  const params = new URLSearchParams();
  params.set("number", number.toString());
  return request<"validateShotNumber">(
    `/api/clips/${clipId}/shots/validate/shot-number?${params.toString()}`,
    { signal: abortSignal },
  );
}

export async function getNextSceneNumber({
  projectId,
  abortSignal,
}: NextSceneNumberOptions): Promise<NextAvailableNumberResponse> {
  return request<"nextSceneNumber">(`/api/projects/${projectId}/scenes/next-number`, {
    signal: abortSignal,
  });
}

export async function getNextClipNumber({
  sceneId,
  abortSignal,
}: NextClipNumberOptions): Promise<NextAvailableNumberResponse> {
  return request<"nextClipNumber">(`/api/scenes/${sceneId}/clips/next-number`, {
    signal: abortSignal,
  });
}

export async function getNextShotNumber({
  clipId,
  abortSignal,
}: NextShotNumberOptions): Promise<NextAvailableNumberResponse> {
  return request<"nextShotNumber">(`/api/clips/${clipId}/shots/next-number`, {
    signal: abortSignal,
  });
}

export async function createShot({
  clipId,
  payload,
  abortSignal,
}: {
  clipId: number;
  payload: ShotCreateRequest;
  abortSignal?: AbortSignal;
}): Promise<ShotResponse> {
  return request<"createClipShot">(`/api/clips/${clipId}/shots`, {
    method: "POST",
    body: payload,
    signal: abortSignal,
  });
}

/**
 * List every scene belonging to a project.
 */
export function listScenes(projectId: number, abortSignal?: AbortSignal): Promise<SceneResponse[]> {
  return request<"listProjectScenes">(`/api/projects/${projectId}/scenes`, {
    signal: abortSignal,
  });
}

/**
 * List every clip belonging to a scene.
 */
export function listClips(sceneId: number, abortSignal?: AbortSignal): Promise<ClipResponse[]> {
  return request<"listSceneClips">(`/api/scenes/${sceneId}/clips`, {
    signal: abortSignal,
  });
}

/**
 * List every shot belonging to a clip.
 */
export function listShots(clipId: number, abortSignal?: AbortSignal): Promise<ShotResponse[]> {
  return request<"listClipShots">(`/api/clips/${clipId}/shots`, {
    signal: abortSignal,
  });
}

/**
 * List every generation attempt for a shot.
 */
export function listGenerations(
  shotId: number,
  abortSignal?: AbortSignal,
): Promise<GenerationDetailResponse[]> {
  return request<"listShotGenerations">(`/api/shots/${shotId}/generations`, {
    signal: abortSignal,
  });
}

/* ------------------------------------------------------------------ */
/*  Scene CRUD (direct endpoints)                                     */
/* ------------------------------------------------------------------ */

export function getSceneById(id: number, abortSignal?: AbortSignal): Promise<SceneResponse> {
  return request<"getSceneById">(`/api/scenes/${id}`, {
    signal: abortSignal,
  });
}

export function updateScene(
  id: number,
  payload: SceneUpdateRequest,
  abortSignal?: AbortSignal,
): Promise<SceneResponse> {
  return request<"updateSceneById">(`/api/scenes/${id}`, {
    method: "PATCH",
    body: payload,
    signal: abortSignal,
  });
}

export function deleteScene(id: number, abortSignal?: AbortSignal): Promise<null> {
  return request<"deleteSceneById">(`/api/scenes/${id}`, {
    method: "DELETE",
    signal: abortSignal,
  });
}

/* ------------------------------------------------------------------ */
/*  Clip CRUD (direct endpoints)                                      */
/* ------------------------------------------------------------------ */

export function getClipById(id: number, abortSignal?: AbortSignal): Promise<ClipResponse> {
  return request<"getClipById">(`/api/clips/${id}`, {
    signal: abortSignal,
  });
}

export function updateClip(
  id: number,
  payload: ClipUpdateRequest,
  abortSignal?: AbortSignal,
): Promise<ClipResponse> {
  return request<"updateClipById">(`/api/clips/${id}`, {
    method: "PATCH",
    body: payload,
    signal: abortSignal,
  });
}

export function deleteClip(id: number, abortSignal?: AbortSignal): Promise<null> {
  return request<"deleteClipById">(`/api/clips/${id}`, {
    method: "DELETE",
    signal: abortSignal,
  });
}

/* ------------------------------------------------------------------ */
/*  Shot CRUD (direct endpoints)                                      */
/* ------------------------------------------------------------------ */

export function getShotById(id: number, abortSignal?: AbortSignal): Promise<ShotResponse> {
  return request<"getShotById">(`/api/shots/${id}`, {
    signal: abortSignal,
  });
}

export function updateShot(
  id: number,
  payload: ShotUpdateRequest,
  abortSignal?: AbortSignal,
): Promise<ShotResponse> {
  return request<"updateShotById">(`/api/shots/${id}`, {
    method: "PATCH",
    body: payload,
    signal: abortSignal,
  });
}

export function deleteShot(id: number, abortSignal?: AbortSignal): Promise<null> {
  return request<"deleteShotById">(`/api/shots/${id}`, {
    method: "DELETE",
    signal: abortSignal,
  });
}
