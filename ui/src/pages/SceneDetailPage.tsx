import { useParams } from "react-router";

import SceneDetail from "@/components/explorer/SceneDetail";

export default function SceneDetailPage() {
  const params = useParams();
  const sceneId = Number(params.sceneId ?? "0");
  if (sceneId === 0 || Number.isNaN(sceneId)) return null;
  return <SceneDetail selectedSceneId={sceneId} />;
}
