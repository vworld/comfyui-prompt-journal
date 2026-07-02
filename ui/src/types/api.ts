import type {
  AssetResponse,
  ClipCreateRequest,
  ClipResponse,
  ClipUpdateRequest,
  ClipValidationResponse,
  CurrentStatsResponse,
  GenerationDetailResponse,
  GenerationManualReviewUpdateRequest,
  GenerationSummaryResponse,
  GenerationUpdateRequest,
  NextAvailableNumberResponse,
  PaginatedResponse,
  ProjectCreateRequest,
  ProjectNameValidationResponse,
  ProjectResponse,
  ProjectUpdateRequest,
  RecreateAssetFromArchiveResponse,
  SceneCreateRequest,
  SceneResponse,
  SceneUpdateRequest,
  SceneValidationResponse,
  ShotCreateRequest,
  ShotGenerationCountResponse,
  ShotResponse,
  ShotSearchResult,
  ShotUpdateRequest,
  ShotValidationResponse,
  UploadGenerationRequest,
} from "./index";

export type RequestOptions<T extends keyof APIContract> = Omit<APIContract[T], "response"> & {
  signal?: AbortSignal;
};

export interface APIContract {
  // ─── Projects ─────────────────────────────────────────────
  listProjects: {
    response: ProjectResponse[];
  };

  searchProjects: {
    response: ProjectResponse[];
  };

  getProjectById: {
    response: ProjectResponse;
  };

  createProject: {
    method: "POST";
    body: ProjectCreateRequest;
    response: ProjectResponse;
  };

  updateProjectById: {
    method: "PATCH";
    body: ProjectUpdateRequest;
    response: ProjectResponse;
  };

  deleteProjectById: {
    method: "DELETE";
    response: null;
  };

  validateProjectName: {
    response: ProjectNameValidationResponse;
  };

  validateSceneName: {
    response: SceneValidationResponse;
  };

  validateSceneNumber: {
    response: SceneValidationResponse;
  };

  nextSceneNumber: {
    response: NextAvailableNumberResponse;
  };

  // ─── Scenes (project-level) ───────────────────────────────
  listProjectScenes: {
    response: SceneResponse[];
  };

  searchSceneInProject: {
    response: SceneResponse[];
  };

  createProjectScene: {
    method: "POST";
    body: SceneCreateRequest;
    response: SceneResponse;
  };

  // ─── Scenes (direct) ──────────────────────────────────────
  getSceneById: {
    response: SceneResponse;
  };

  updateSceneById: {
    method: "PATCH";
    body: SceneUpdateRequest;
    response: SceneResponse;
  };

  deleteSceneById: {
    method: "DELETE";
    response: null;
  };

  // ─── Clips (scene-level) ──────────────────────────────────
  listSceneClips: {
    response: ClipResponse[];
  };
  searchClipInScene: {
    response: ClipResponse[];
  };

  createSceneClip: {
    method: "POST";
    body: ClipCreateRequest;
    response: ClipResponse;
  };

  validateClipName: {
    response: ClipValidationResponse;
  };

  validateClipNumber: {
    response: ClipValidationResponse;
  };

  nextClipNumber: {
    response: NextAvailableNumberResponse;
  };

  // ─── Clips (direct) ───────────────────────────────────────
  getClipById: {
    response: ClipResponse;
  };

  updateClipById: {
    method: "PATCH";
    body: ClipUpdateRequest;
    response: ClipResponse;
  };

  deleteClipById: {
    method: "DELETE";
    response: null;
  };

  // ─── Shots (clip-level) ───────────────────────────────────
  listClipShots: {
    response: ShotResponse[];
  };

  createClipShot: {
    method: "POST";
    body: ShotCreateRequest;
    response: ShotResponse;
  };

  validateShotName: {
    response: ShotValidationResponse;
  };

  validateShotNumber: {
    response: ShotValidationResponse;
  };

  nextShotNumber: {
    response: NextAvailableNumberResponse;
  };

  // ─── Shots (direct) ───────────────────────────────────────
  searchShots: {
    response: ShotSearchResult[];
  };

  getShotById: {
    response: ShotResponse;
  };

  updateShotById: {
    method: "PATCH";
    body: ShotUpdateRequest;
    response: ShotResponse;
  };

  deleteShotById: {
    method: "DELETE";
    response: null;
  };

  // ─── Generations (shot-level) ─────────────────────────────
  listShotGenerations: {
    response: GenerationDetailResponse[];
  };

  getShotGenerationCount: {
    response: ShotGenerationCountResponse;
  };

  // ─── Generations (direct) ─────────────────────────────────
  listUnreviewedGenerationIds: {
    response: number[];
  };
  listGenerations: {
    response: PaginatedResponse<GenerationSummaryResponse>;
  };

  getGenerationById: {
    response: GenerationDetailResponse;
  };

  updateGenerationManualReview: {
    method: "PATCH";
    body: GenerationManualReviewUpdateRequest;
    response: GenerationDetailResponse;
  };

  updateGeneration: {
    method: "PATCH";
    body: GenerationUpdateRequest;
    response: GenerationDetailResponse;
  };

  pullIntentFromPreviousAttempt: {
    method: "POST";
    response: GenerationSummaryResponse;
  };

  // ─── Assets ───────────────────────────────────────────────
  getAssetById: {
    response: AssetResponse;
  };

  getAssetFile: {
    response: never;
  };

  recreateAssetFromArchive: {
    response: RecreateAssetFromArchiveResponse;
  };

  // ─── Uploads ──────────────────────────────────────────────
  uploadGeneratedFile: {
    method: "POST";
    body: UploadGenerationRequest;
    response: GenerationDetailResponse;
    isFormData: true;
  };

  // ─── Stats ──────────────────────────────────────────────
  getStats: {
    response: CurrentStatsResponse;
  };
}
