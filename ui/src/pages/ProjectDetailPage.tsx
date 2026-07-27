import { useParams } from "react-router";

import ProjectDetail from "@/components/explorer/ProjectDetail";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.projectId ?? "0");

  return <ProjectDetail selectedProjectId={projectId} />;
}
