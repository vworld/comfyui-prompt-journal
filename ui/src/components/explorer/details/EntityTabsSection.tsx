import type { HierarchyItem } from "@/components/generations/hierarchy/types";
import type { ProjectResponse } from "@/types";

import { useExplorerTree } from "@/components/explorer/tree-context/use-explorer-tree";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EntityTabsSectionProps<T extends Exclude<HierarchyItem, ProjectResponse>> {
  readonly itemLabel: string;
  readonly items: T[];
  readonly onItemClick: (item: T) => void;
  readonly className?: string;
  readonly sortByNumber?: boolean;
}
export default function EntityTabsSection<T extends Exclude<HierarchyItem, ProjectResponse>>({
  itemLabel,
  items,
  onItemClick,
  className,
  sortByNumber = false,
}: EntityTabsSectionProps<T>) {
  const { sort } = useExplorerTree();
  // Sort by number if requested (null numbers at end)
  const displayItems = sortByNumber ? sort.numberedEntities<T>(items) : items;

  return (
    <Tabs defaultValue="items-panel" className={cn("h-full w-full overflow-hidden", className)}>
      <TabsList className="w-full">
        <TabsTrigger value="items-panel">
          {itemLabel} ({items.length})
        </TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="items-panel" className="flex-1 min-h-0 h-full w-full">
        <ScrollArea className="h-full w-full" scrollbarProps={{ gutterClassName: "bg-workspace" }}>
          <div className="flex flex-col gap-2 mb-2">
            {displayItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No scenes yet</div>
            ) : (
              displayItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer bg-workspace hover:bg-card font-mono"
                  onClick={() => onItemClick(item)}
                >
                  <CardHeader className="flex flex-col gap-1">
                    <CardTitle className="text-sm">
                      {item.number ?? "?"} - {item.name}
                    </CardTitle>
                    <div className="text-xs-plus text-muted-foreground">
                      {item.description ?? "No description"}
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="stats">
        <div className="text-sm text-muted-foreground">Stats placeholder</div>
      </TabsContent>
    </Tabs>
  );
}
