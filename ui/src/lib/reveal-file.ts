import { dirname } from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

import type { AssetResponse } from "@/types";
import type { AlertContextValue } from "@/types/alert";

import { recreateAssetFromArchive } from "@/api/generations";

/**
 * Returns void when success and throws on failure
 * @param abs_file_path
 * @returns
 */
export async function revealFileInDir(abs_file_path: string): Promise<void> {
  return revealItemInDir(abs_file_path);
}

export async function pathExists(abs_path: string): Promise<boolean> {
  return exists(abs_path);
}

export async function getFileDir(file_path: string) {
  return dirname(file_path);
}

export async function revealAssetInDir(
  asset: Pick<AssetResponse, "orig_file_path" | "id" | "file_name">,
  alertDialog: Pick<AlertContextValue, "confirm" | "error">,
) {
  try {
    if (!asset.orig_file_path)
      return alertDialog.error({ title: "Unexpected Error! Path to file not found" });

    const exists = await pathExists(asset.orig_file_path);
    if (exists) {
      await revealFileInDir(asset.orig_file_path);
      toast.success("Successfully opened folder");
      return;
    }

    const dir = await getFileDir(asset.orig_file_path);
    const recreate = await alertDialog.confirm({
      title: "File Missing on disk",
      description: `The requested file "${asset.file_name}" does not exist.
  
  Directory:${dir}`,
      confirmText: "Yes",
      cancelText: "No",
    });

    if (!recreate) {
      toast.info("Operation Cancelled");
      return;
    }

    const response = await recreateAssetFromArchive(asset.id);
    await revealFileInDir(response.recreated_path);
    toast.success("Successfully opened folder");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await alertDialog.error({
      title: "Reveal in Folder Failed",
      description: message,
    });
  }
}
