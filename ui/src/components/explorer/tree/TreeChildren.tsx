import type { TreeNodeWithChildren } from "@/components/explorer/types";

import TreeRow, { type TreeRowProps } from "@/components/explorer/tree/TreeRow";

type TreeChildrenProps = Omit<TreeRowProps, "depth">;

export default function Children(props: Readonly<TreeChildrenProps>) {
  const { node, expanded, selectedId, loading, onToggle, onSelect } = props;
  const children: TreeNodeWithChildren[] | undefined = node._children;

  if (!children || children.length === 0) {
    return <div className="px-3 py-1 text-xs text-muted-foreground">Empty</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {children.map((child) => (
        <TreeRow
          key={`${child.kind}-${child.data.id}`}
          node={child}
          depth={0}
          expanded={expanded}
          selectedId={selectedId}
          loading={loading}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
