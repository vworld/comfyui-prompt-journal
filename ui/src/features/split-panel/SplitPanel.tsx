import type {
  SplitPaneHeaderProps,
  SplitPaneProps,
  SplitPanelProps,
} from "@/features/split-panel/types";
import type { ReactNode } from "react";

import SplitPanelViewImpl from "@/features/split-panel/components/SplitPanelViewImpl";

/**
 * A generic, VS Code sidebar–style split panel: panes stack (or sit
 * side-by-side) with draggable splitters between them, and every pane
 * can independently collapse down to just its header — including all
 * of them at once. That last part is the reason this exists rather than
 * `react-resizable-panels`: both of those model panes as
 * a proportional partition that must always sum to 100%, so at least one
 * pane is always forced to stay visible. This component has no such
 * constraint.
 *
 * ---
 * ## Configuring panes
 *
 * **Declarative (default)** — layout is derived from `<SplitPane>` children:
 *
 * ```tsx
 * <SplitPanel id="tree-sidebar">
 *   <SplitPane id="explorer" label="Explorer" minimumSize={120} defaultSize={50}>
 *     <ExplorerTree />
 *   </SplitPane>
 *   <SplitPane id="outline" label="Outline" minimumSize={80} defaultSize={50}>
 *     <OutlineView />
 *   </SplitPane>
 * </SplitPanel>
 * ```
 *
 *
 * Config from `children`is read once, on mount, via `useState`'s
 * lazy initializer — passing a new value on a later render does NOT
 * re-layout an already-mounted panel. There is currently no supported way
 * to push a new layout into a live instance.
 *
 * ---
 * ## Orientation
 *
 * `orientation="vertical"` (default) stacks panes top-to-bottom with
 * horizontal splitter bars. `orientation="horizontal"` lays panes
 * side-by-side with vertical splitter bars. Collapsing a pane in
 * horizontal orientation rotates its header 90° into a vertical strip —
 * this was built on the assumption that collapsing in horizontal layouts
 * is a rare need; if that's wrong for your use case, you can override the header.
 *
 * ---
 * ## Customizing a pane's header — three tiers, cheapest first
 *
 * 1. **Nothing** — default chevron + uppercase label, built from
 *    `<SplitPane>`'s `label` prop.
 *
 * 2. **CSS only** — same DOM and behavior, your classes merged in:
 *
 *    ```tsx
 *    <SplitPane id="explorer" label="Explorer" minimumSize={120} defaultSize={300}>
 *      <SplitPaneHeader className="bg-red-500 text-white" />
 *      <ExplorerTree />
 *    </SplitPane>
 *    ```
 *
 * 3. **Full override** — you own the header's DOM. Use the function form
 *    of `children` to react to the pane's live `collapsed` state or
 *    `orientation`:
 *
 *    ```tsx
 *    <SplitPane id="explorer" label="Explorer" minimumSize={120} defaultSize={50}>
 *      <SplitPaneHeader>
 *        {({ pane, orientation, onToggle }) => (
 *          <div className="flex items-center gap-1 px-1 py-1" onClick={onToggle}>
 *            {pane.collapsed ? <ChevronRight /> : <ChevronDown />}
 *            <span>{pane.label}</span>
 *            {!pane.collapsed && <RefreshButton />}
 *          </div>
 *        )}
 *      </SplitPaneHeader>
 *      <ExplorerTree />
 *    </SplitPane>
 *    ```
 *
 * `<SplitPaneHeader>` must be a direct child of `<SplitPane>` — it is not
 * unwrapped from inside a Fragment or nested element.
 *
 * ---
 * ## Scroll behavior
 *
 * Pane content is wrapped in a `ScrollArea` by default. Set
 * `scrollable={false}` on `<SplitPane>` if your content manages its own
 * scrolling (e.g. a virtualized list).
 *
 * ---
 * ## Persistence
 *
 * `id` doubles as the localStorage key — it must be unique per
 * `SplitPanel` instance on the page, or two instances will silently
 * clobber each other's saved layout. `version` should be bumped whenever
 * the *shape* of your layout config changes (pane count/ids), to
 * invalidate stale persisted layouts rather than trying to migrate them.
 *
 * Set `disablePersistence={true}` to disable persisting layout to localStorage
 *
 * ---
 * ## What's deliberately not built
 *
 * No keyboard resize, no ARIA live regions, no SSR guarantee. This is
 * scoped to solve one gap in the mainstream libraries (simultaneous
 * multi-pane collapse), not to reach feature parity with them — PRs for
 * any of the above are welcome, but they aren't planned work.
 * TODO: CHECK Allotment
 * TODO: Expose scrollContainerRefs, paneRefs, ContainerRef - via hook
 * TODO: decouple header label from persistent layout
 */

export function SplitPanel(props: Readonly<SplitPanelProps>) {
  return <SplitPanelViewImpl {...props} />;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SplitPane(_props: Readonly<SplitPaneProps>): ReactNode {
  // Usage: <SplitPanel><SplitPane .../></SplitPanel>.
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SplitPaneHeader(_props: Readonly<SplitPaneHeaderProps>): ReactNode {
  // Never rendered directly — SplitPanel extracts both `className` and
  // `children` from this and forwards them to SplitPaneHeaderView.
  return null;
}
