import { useCallback } from "react";

import type { TreeNodeWithChildren, UseProjectTree } from "@/components/explorer/types";

import { ClosedIcon, OpenIcon, TreeNodeIcon } from "@/components/explorer/tree/Icons";
import Children from "@/components/explorer/tree/TreeChildren";
import { labelFor } from "@/components/explorer/tree/labels";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface TreeRowProps {
  node: TreeNodeWithChildren;
  depth: number;
  expanded: UseProjectTree["expanded"];
  selectedId: UseProjectTree["selectedId"];
  loading: UseProjectTree["loading"];
  onToggle: UseProjectTree["toggle"];
  onSelect: UseProjectTree["handleSelect"];
}

export default function TreeRow(props: Readonly<TreeRowProps>) {
  const { node, depth, expanded, selectedId, loading, onToggle, onSelect } = props;

  const key = `${node.kind}-${node.data.id}`;
  const isOpen = expanded.has(key);
  const isSelected = selectedId === key;
  const isLoading = loading.has(key);
  const hasChildren = node.kind !== "generation";
  const indent = depth * 12;

  const scrollSelfIntoView = useCallback(
    (el: HTMLButtonElement | null) => {
      if (isSelected && el) {
        el.scrollIntoView({ block: "nearest" });
      }
    },
    [isSelected],
  );
  if (!hasChildren) {
    return (
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-full justify-start gap-0 text-foreground transition-none"
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onSelect(node)}
        ref={scrollSelfIntoView}
      >
        <TreeNodeIcon kind={node.kind} />
        <span className="ml-2 truncate">{labelFor(node)}</span>
      </Button>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 shrink-0 justify-center p-0 transition-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => onToggle(node)}
        >
          {isOpen ? <OpenIcon /> : <ClosedIcon />}
        </Button>
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          size="sm"
          className="group h-8 min-w-0 flex-1 justify-start transition-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => onSelect(node)}
          ref={scrollSelfIntoView}
        >
          <TreeNodeIcon kind={node.kind} />
          <span className="ml-1 truncate">{labelFor(node)}</span>
        </Button>
      </div>
      <div style={{ marginLeft: `${indent + 20}px` }}>
        {isOpen &&
          (isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <Spinner />
              Loading…
            </div>
          ) : (
            <Children
              node={node}
              expanded={expanded}
              selectedId={selectedId}
              loading={loading}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
      </div>
    </div>
  );
}
