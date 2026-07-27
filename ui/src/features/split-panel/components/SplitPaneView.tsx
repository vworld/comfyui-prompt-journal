import type {
  SplitPaneHeaderRenderProps,
  SplitPaneState,
  SplitPanelLayout,
} from "@/features/split-panel/types";
import type { ReactNode } from "react";

import SplitPaneHeaderView from "@/features/split-panel/components/SplitPaneHeaderView";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SplitPaneView — the actual per-pane chrome (header + collapse +    */
/*  optional scroll wrapper). Generic; knows nothing about app content. */
/* ------------------------------------------------------------------ */

export default function SplitPaneView({
  panelId,
  pane,
  orientation,
  collapsedPaneSize,
  className,
  hideHeader = false,
  header,
  headerClassName,
  paneRef,
  onToggle,
  children,
}: Readonly<{
  panelId: string;
  pane: SplitPaneState;
  orientation: SplitPanelLayout["orientation"];
  collapsedPaneSize: number;
  className?: string;
  hideHeader?: boolean;
  header?: ReactNode | ((props: SplitPaneHeaderRenderProps) => ReactNode);
  headerClassName?: string;
  paneRef: (el: HTMLDivElement | null) => void;
  onToggle: () => void;
  children: ReactNode;
}>) {
  const isVertical = orientation === "vertical";

  const paneId = `${panelId}__${pane.id}`;

  return (
    <div
      id={`${paneId}__pane`}
      ref={paneRef}
      className={cn(
        "flex-none py-0 overflow-hidden",
        //  isVertical ? "w-full" : "h-full",
        className,
      )}
      style={isVertical ? { height: pane.size } : { width: pane.size }}
    >
      <div id={`${paneId}__pane-content-container`} className="flex flex-col h-full w-full">
        {!hideHeader && (
          <div
            id={`${paneId}__pane-header`}
            className={cn(pane.collapsed ? "" : "mb-0.5")}
            style={
              orientation === "horizontal" && pane.collapsed
                ? { width: `${collapsedPaneSize}px` }
                : { height: `${collapsedPaneSize}px` }
            }
          >
            <SplitPaneHeaderView
              pane={pane}
              orientation={orientation}
              className={headerClassName}
              onToggle={onToggle}
            >
              {header}
            </SplitPaneHeaderView>
          </div>
        )}

        {
          !pane.collapsed && (
            <div
              id={`${paneId}__pane-content-area`}
              className="min-h-0 w-full h-full overflow-hidden"
            >
              {children}
            </div>
          )
          // (scrollable ? (
          //   <ScrollArea
          //     id={`${paneId}__pane-scroll-area`}
          //     className="flex-1 min-h-0 w-full border-none"
          //     scrollbarProps={{ gutterClassName: "bg-card" }}
          //     horizontalScrollbarProps={{ orientation: "horizontal" }}
          //     enableWorkaroundForNestedScrollAreas={true}
          //   >
          //     {children}
          //     {/* <ScrollBar orientation="horizontal" /> */}
          //   </ScrollArea>
          // ) : (
          //   <div
          //     id={`${paneId}__pane-content-area`}
          //     className="flex-1 min-h-0 w-full h-full overflow-hidden"
          //   >
          //     {children}
          //   </div>
          // ))
        }
      </div>
    </div>
  );
}
