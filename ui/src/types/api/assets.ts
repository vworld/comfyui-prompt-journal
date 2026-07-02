export interface AssetResponse {
  id: number;
  file_name: string;
  file_timestamp: number;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  duration_seconds: number | null;
  description: string | null;
  added_on: number;
  orig_file_path: string | null;
}

export interface RecreateAssetFromArchiveResponse {
  asset_id: number;
  recreated_path: string;
  copied: boolean;
}
