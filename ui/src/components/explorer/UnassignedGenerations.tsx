import { useNavigate } from "react-router";

import GenerationList from "@/components/explorer/GenerationList";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UnassignedGenerations() {
  const { unassignedRef } = useExplorerTree();
  const navigate = useNavigate();

  return (
    <ScrollArea
      className="w-full h-full"
      scrollbarProps={{ gutterClassName: "bg-card" }}
      horizontalScrollbarProps={{ orientation: "horizontal" }}
    >
      <div ref={unassignedRef} className="flex flex-col h-full w-full min-h-0 gap-1 mx-2 my-1">
        <GenerationList
          withShot={false}
          onGenerationClick={(id) => void navigate(`/explorer/unassigned/${id}`)}
          pageSize={20}
        />
      </div>
    </ScrollArea>
  );
}
