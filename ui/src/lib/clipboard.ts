import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";

import { logger } from "@/lib/logger";

export async function writeToClipboard(
  text: string,
  successMessage = "Copied to clipboard",
): Promise<boolean> {
  try {
    await writeText(text);
    toast.success(successMessage);
    return true;
  } catch (error) {
    logger.error(error);
    toast.error("Failed to copy to clipboard");
    return false;
  }
}

export async function readFromClipboard(): Promise<string | null> {
  try {
    return await readText();
  } catch (error) {
    logger.error(error);
    return null;
  }
}
