import { request } from "./client";

import type {
  ClipCreateRequest,
  ClipResponse,
  ClipValidationResponse,
  NextAvailableNumberResponse,
  ProjectCreateRequest,
  ProjectNameValidationResponse,
  ProjectResponse,
  SceneCreateRequest,
  SceneResponse,
  SceneValidationResponse,
  ShotCreateRequest,
  ShotResponse,
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
