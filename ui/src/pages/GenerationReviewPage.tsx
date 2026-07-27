import { useEffect } from "react";
import { useParams } from "react-router";

import { getGeneration } from "@/api/generations";
import { ReviewConsole } from "@/components/ReviewConsole";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";

export default function GenerationReviewPage({
  pane,
}: Readonly<{
  pane: "assigned" | "unassigned" | "tree";
}>) {
  const params = useParams();
  const generationId = Number(params.generationId ?? "0");
  const { selectNode } = useExplorerTree();

  useEffect(() => {
    async function selectGenerationInTree(abort: AbortController) {
      if (generationId <= 0) return;

      const gen = await getGeneration(generationId, abort.signal);
      if (!abort.signal.aborted && gen) {
        selectNode({
          node: { kind: "generation", data: gen },
          abortController: abort,
          pane,
        });
      }
    }
    const abort = new AbortController();
    void selectGenerationInTree(abort);

    return () => abort.abort();
  }, [generationId, pane, selectNode]);

  if (generationId === 0 || Number.isNaN(generationId)) return null;
  return (
    <div className="mx-2">
      <ReviewConsole generationId={generationId} />
    </div>
  );
}
