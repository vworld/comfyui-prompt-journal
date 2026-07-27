import {
  Fragment,
  type ReactElement,
  type ReactNode,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type {
  DragState,
  SplitPaneHeaderProps,
  SplitPaneHeaderRenderProps,
  SplitPaneProps,
  SplitPanelLayoutConfig,
  SplitPanelProps,
} from "@/features/split-panel/types";

import { SplitPane, SplitPaneHeader } from "@/features/split-panel/SplitPanel";
import { HorizontalSplitter } from "@/features/split-panel/components/HorizontalSplitter";
import SplitPaneView from "@/features/split-panel/components/SplitPaneView";
import { VerticalSplitter } from "@/features/split-panel/components/VerticalSplitter";
import { SplitPanelService } from "@/features/split-panel/lib/SplitPanelService";
import { buildLayoutConfig } from "@/features/split-panel/lib/build-layout-config";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SplitPanel — owns the layout service instance and orchestration.   */
/* ------------------------------------------------------------------ */

export default function SplitPanelViewImpl({
  id,
  orientation = "vertical",
  supportsCollapse = true,
  collapsedPaneSize = 34,
  splitterSize = 4,
  className,
  debug = false,
  disablePersistence = false,
  hideHeader = false,
  version,
  children,
}: Readonly<SplitPanelProps>) {
  const paneElements = useMemo(() => {
    const list = Array.isArray(children) ? children : [children];
    return list.filter(
      (child): child is ReactElement<SplitPaneProps> =>
        isValidElement(child) && child.type === SplitPane,
    );
  }, [children]);

  // Layout config only matters for the very first load (or when storage
  // is invalidated); it must not be rebuilt just because pane `children`
  // content re-renders, so we compute it once and hold it in a ref.
  const [config] = useState<SplitPanelLayoutConfig>(() =>
    buildLayoutConfig(paneElements, {
      panelId: id,
      orientation,
      supportsCollapse,
      collapsedPaneSize,
      splitterSize,
      version: version ?? __APP_VERSION__,
      hideHeader,
    }),
  );
  const [service] = useState<SplitPanelService>(
    () =>
      new SplitPanelService({
        id,
        config,
        persistLayout: !disablePersistence,
      }),
  );

  const [mounted, setMounted] = useState(false);
  const state = useSyncExternalStore(
    service.subscribe.bind(service),
    service.getState.bind(service),
  );
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      service.observeContainerResize(node);
      if (!node) return;

      const availableSpace = orientation === "vertical" ? node.clientHeight : node.clientWidth;
      if (availableSpace === 0) return;
      const didLoad = service.load(availableSpace);
      if (didLoad) {
        if (debug) service.toggleDebugMode(true, paneRefs);
        setMounted(true);
      }
    },
    [service, orientation, debug],
  );

  // Map of pane id -> the actual React content + per-pane display options,
  // looked up by id each render so drag/resize (which reorders/produces
  // new `state.panes` objects) never has to touch the content itself.
  const contentById = useMemo(() => {
    const map = new Map<
      string,
      {
        node: ReactNode;
        header?: ReactNode | ((props: SplitPaneHeaderRenderProps) => ReactNode);
        headerClassName?: string;
        className?: string;
      }
    >();

    for (const el of paneElements) {
      const rawChildren = el.props.children;
      const childList = (Array.isArray(rawChildren) ? rawChildren : [rawChildren]) as ReactNode[];

      let header: SplitPaneHeaderProps["children"];
      let headerClassName: string | undefined;
      const body: ReactNode[] = [];

      for (const child of childList) {
        if (isValidElement<SplitPaneHeaderProps>(child) && child.type === SplitPaneHeader) {
          header = child.props.children;
          headerClassName = child.props.className;
        } else {
          body.push(child);
        }
      }
      map.set(el.props.id, {
        node: body,
        header,
        headerClassName,
        className: el.props.className,
      });
    }
    return map;
  }, [paneElements]);

  const dragHandler = (dragState: DragState, splitterIndex: number) => {
    const { last, delta } = dragState;
    service.onDrag({ splitterIndex, last, delta });
  };

  const lastIndex = (state?.panes?.length ?? 0) - 1;

  return (
    <div
      id={`${id}__panel-container`}
      ref={containerRef}
      className={cn(
        "flex size-full gap-0",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {mounted && state.panes && (
        <>
          {state.panes.map((pane, index) => {
            const content = contentById.get(pane.id);
            return (
              <Fragment key={pane.id}>
                <SplitPaneView
                  pane={pane}
                  panelId={id}
                  orientation={orientation}
                  collapsedPaneSize={service.collapsedPaneSize}
                  className={content?.className}
                  hideHeader={hideHeader}
                  header={content?.header}
                  headerClassName={content?.headerClassName}
                  paneRef={(el) => {
                    paneRefs.current[index] = el;
                  }}
                  onToggle={() => service.toggle(pane.order)}
                >
                  {content?.node}
                </SplitPaneView>

                {index < lastIndex &&
                  (orientation === "vertical" ? (
                    <HorizontalSplitter
                      className="bg-workspace"
                      onDrag={(dragState) => dragHandler(dragState, index)}
                      disabled={!service.isSplitterActive(index)}
                      height={service.splitterSize}
                    />
                  ) : (
                    <VerticalSplitter
                      className="bg-workspace"
                      onDrag={(dragState) => dragHandler(dragState, index)}
                      disabled={!service.isSplitterActive(index)}
                      width={service.splitterSize}
                    />
                  ))}
              </Fragment>
            );
          })}
        </>
      )}
    </div>
  );
}
