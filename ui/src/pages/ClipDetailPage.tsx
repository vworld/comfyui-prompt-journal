import { useParams } from "react-router";

import ClipDetail from "@/components/explorer/ClipDetail";

export default function ClipDetailPage() {
  const params = useParams();
  const clipId = Number(params.clipId ?? "0");
  if (clipId === 0 || Number.isNaN(clipId)) return null;
  return <ClipDetail selectedClipId={clipId} />;
}
