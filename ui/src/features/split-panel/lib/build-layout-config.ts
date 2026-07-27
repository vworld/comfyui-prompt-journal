import type {
  SplitPaneProps,
  SplitPanelLayout,
  SplitPanelLayoutConfig,
} from "@/features/split-panel/types";
import type { ReactElement } from "react";

export function buildLayoutConfig(
  paneElements: ReactElement<SplitPaneProps>[],
  opts: {
    panelId: string;
    orientation: SplitPanelLayout["orientation"];
    supportsCollapse: boolean;
    collapsedPaneSize: number;
    splitterSize: number;
    hideHeader: boolean;
    version: string;
  },
): SplitPanelLayoutConfig {
  const total = paneElements.reduce((sum, pane) => sum + pane.props.defaultSize, 0);
  if (Math.abs(total - 100) > 1e-6) {
    throw new Error(
      `SplitPanel: "${opts.panelId}": defaultSize values must sum to 100 (got ${total}).`,
    );
  }

  const authoredSpace = 100;
  const usableSpace = authoredSpace - Math.max(paneElements.length - 1, 0) * opts.splitterSize;

  const panes = paneElements.map<SplitPanelLayoutConfig["panes"][number]>((el, index) => ({
    id: el.props.id,
    order: index,
    label: el.props.label,
    minimumSize: el.props.minimumSize,
    rememberedSize: 0,
    size: (usableSpace * el.props.defaultSize) / 100,
    collapsed: false,
  }));

  return {
    orientation: opts.orientation,
    supportsCollapse: opts.hideHeader ? false : opts.supportsCollapse,
    collapsedPaneSize: opts.hideHeader ? 0 : opts.collapsedPaneSize,
    splitterSize: opts.splitterSize,
    availableSpace: authoredSpace,
    version: opts.version,
    panes,
  };
}
