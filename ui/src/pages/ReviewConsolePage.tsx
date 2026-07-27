import { useParams } from "react-router";

import { ReviewConsole } from "@/components/ReviewConsole";
import NoUnreviewedGenerationFound from "@/components/generations/NoUnreviewedGenerationFound";

export default function ReviewConsolePage() {
  const params = useParams();
  const generationId = Number(params.generationId ?? "0");
  if (generationId === 0 || Number.isNaN(generationId)) return <NoUnreviewedGenerationFound />;
  return (
    <div className="m-2">
      <ReviewConsole key={generationId} generationId={generationId} />
    </div>
  );
}
