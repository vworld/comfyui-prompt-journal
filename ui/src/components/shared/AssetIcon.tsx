import { FileQuestion, Headphones, Image, Video } from "lucide-react";

import type { AssetResponse } from "@/types";

import { mediaKindFromMime } from "@/api/transforms";

export function AssetIcon({
  outputAsset,
  size,
}: Readonly<{ outputAsset: AssetResponse; size?: number }>) {
  const s = size ?? 16;
  const assetType = mediaKindFromMime(outputAsset.mime_type);
  if (assetType === "image") return <Image size={s} />;

  if (assetType === "video") return <Video size={s} />;

  if (assetType === "audio") return <Headphones size={s} />;

  return <FileQuestion size={s} />;
}
