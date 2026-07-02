export interface CurrentStatsResponse {
  generation: {
    total: number;
    reviewed: number;
    unreviewed: number;
    unassigned: number;
  };
  projects: number;
  scenes: number;
  clips: number;
  shots: number;
  assets: number;
}
