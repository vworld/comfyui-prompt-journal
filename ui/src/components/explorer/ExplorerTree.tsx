import TreeRow from "@/components/explorer/tree/TreeRow";
import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ExplorerTree() {
  const { roots, expanded, selectedId, loading, toggle, handleSelect, treeRef } = useExplorerTree();

  return (
    <ScrollArea
      className="w-full h-full"
      scrollbarProps={{ gutterClassName: "bg-card" }}
      horizontalScrollbarProps={{ orientation: "horizontal" }}
    >
      <div ref={treeRef} className="flex flex-col gap-1 p-2">
        {roots.length === 0 ? (
          <div className="px-2 py-1 text-xs text-muted-foreground">No projects found</div>
        ) : (
          roots.map((node) => (
            <TreeRow
              key={`${node.kind}-${node.data.id}`}
              node={node}
              depth={0}
              expanded={expanded}
              selectedId={selectedId}
              loading={loading}
              onToggle={toggle}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
