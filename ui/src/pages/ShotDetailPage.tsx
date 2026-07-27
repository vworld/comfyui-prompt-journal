import { useParams } from "react-router";

import ShotDetail from "@/components/explorer/ShotDetail";

export default function ShotDetailPage() {
  const params = useParams();
  const shotId = Number(params.shotId ?? "0");
  if (shotId === 0 || Number.isNaN(shotId)) return null;
  return <ShotDetail selectedShotId={shotId} />;
}
