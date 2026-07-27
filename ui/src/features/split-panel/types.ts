import type { EventTypes, FullGestureState, Vector2 } from "@use-gesture/react";
import type { ReactElement, ReactNode } from "react";

export type DragState = Omit<FullGestureState<"drag">, "event"> & { event: EventTypes["drag"] };

export interface SplitPaneProps {
  /** Stable identifier. Used as the layout/state key and for localStorage persistence. */
  id: string;
  /** Header label. */
  label: string;
  minimumSize: number;
  /**
   * Initial size used only until the user resizes (or a stored layout exists).
   *
   * Percentage of the available layout space.
   * All panes must sum to 100.
   */
  defaultSize: number;
  /** Extra classes applied to this pane's outer container. */
  className?: string;
  children: ReactNode;
}

export interface SplitPanelProps {
  /** Unique id for this panel instance; used as the persistence key. */
  id: string;
  /**
   * "vertical" stacks panes top-to-bottom with horizontal splitter bars
   * (drag axis y). "horizontal" lays panes side-by-side with vertical
   * splitter bars (drag axis x).
   */
  orientation?: SplitPanelLayout["orientation"];
  supportsCollapse?: boolean;
  collapsedPaneSize?: number;
  splitterSize?: number;
  className?: string;
  debug?: boolean;
  disablePersistence?: boolean;
  hideHeader?: boolean;
  version?: string;
  children: ReactElement<SplitPaneProps> | ReactElement<SplitPaneProps>[];
}

export interface SplitPaneHeaderRenderProps {
  pane: SplitPaneState;
  orientation: SplitPanelLayout["orientation"];
  onToggle: () => void;
}

export interface SplitPaneHeaderProps {
  /**
   * Style-only override, merged onto the default chevron+label header's
   * classes. Ignored when `children` is provided — at that point you own
   * the DOM and should style it yourself.
   */
  className?: string;
  /**
   * Either static content, or a render function receiving the current
   * pane state and orientation — use the function form if your header
   * needs to react to collapsed/expanded state or orientation.
   */
  children: ReactNode | ((props: SplitPaneHeaderRenderProps) => ReactNode);
}

/**
 * All sizes:
 * - unit: pixels
 * - includes header height
 */
export interface SplitPaneState {
  order: number;
  id: string;
  label: string;
  collapsed: boolean;
  minimumSize: number;
  /**
   * Represents
   *  - Last expanded size while collapsed.
   */
  rememberedSize: number;
  size: number;
}

export interface SplitPanelLayout {
  orientation: "vertical" | "horizontal";
  supportsCollapse: boolean;
  collapsedPaneSize: number;
  splitterSize: number;
  availableSpace: number;
  panes: SplitPaneState[];
  version: string;
}

export interface SplitPanelLayoutConfig extends Omit<SplitPanelLayout, "panes"> {
  panes: (Omit<SplitPaneState, "collapsed"> & { collapsed: false })[];
}

export interface SplitPanelState {
  panes: SplitPaneState[];
}

export interface OnDragArgs {
  last: boolean;
  splitterIndex: number;
  delta: Vector2;
}
export interface SpaceDistribution {
  recoveredSpace: number;
  contributors: {
    index: number;
    space: number;
  }[];
}

export interface SplitPanelServiceOptions {
  id: string;
  config: SplitPanelLayout;
  persistLayout: boolean;
}
