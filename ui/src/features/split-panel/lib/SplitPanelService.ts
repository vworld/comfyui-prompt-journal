import type {
  OnDragArgs,
  SpaceDistribution,
  SplitPaneState,
  SplitPanelLayout,
  SplitPanelServiceOptions,
  SplitPanelState,
} from "@/features/split-panel/types";
import type { RefObject } from "react";

import { type StorageAdapter, createLocalStorage } from "@/hooks/use-local-store";
import { ExternalStoreAbstract } from "@/lib/external-store-abstract";

// const DEFAULT_LAYOUT: SplitPanelLayoutConfig = {
//   orientation: "vertical",
//   supportsCollapse: true,
//   splitterSize: 4,
//   collapsedPaneSize: 34,
//   availableSpace: 100,
//   panes: [
//     {
//       order: 0,
//       id: "hierarchy",
//       label: "Hierarchy",
//       collapsed: false,
//       minimumSize: 150,
//       rememberedSize: 0,
//       size: 46, // 50%
//     },
//     {
//       order: 1,
//       id: "unassigned",
//       label: "Unassigned",
//       collapsed: false,
//       minimumSize: 150,
//       rememberedSize: 0,
//       size: 23,
//     },
//     {
//       order: 2,
//       id: "assigned",
//       label: "assigned",
//       collapsed: false,
//       minimumSize: 150,
//       rememberedSize: 0,
//       size: 23,
//     },
//   ],

//   version: __APP_VERSION__,
// };

/**
 * ## Assumptions, Invariants and Notes
 *
 * ### State handling
 * - Service is the sole mutator of state
 * - State is mutated in-place until committed
 *   (simplifies iterative layout algorithms; avoids intermediate cloning;
 *   published state is immutable)
 * - References obtained before commit are invalid after commit
 *
 * ### Panes
 * - Pane order equals its index in the panes array
 *   - no duplicates
 *   - no gaps
 * - Panes re-order is not supported (although recreating the array and updating order prop can easily implement it)
 * - Similarly runtime addition of panes is not supported
 * - Exactly one expanded pane is elastic
 * - Collapsed panes are never elastic
 *
 * ### Splitter
 * - Splitter i separates pane i and pane i + 1.
 * - `count = paneCount - 1`
 * - Index is 0 based, const and sequential
 *
 * ### Sizing
 * - `availableSpace`: DOM clientHeight / clientWidth
 * - `maxUsableContainerSize` is `availableSpace - splitterSpace`
 * - `scalableSize` is `maxUsableContainerSize - collapsedPanesSpace`
 * - Nearest-first resizing
 *
 * ### Requirements
 * - splitterSize and collapsedSize must be used exactly
 * - panes must be `flex-none`
 * - `load()` must be called as soon as the containerHeight is available and pane rendering should happen after
 *
 */
export class SplitPanelService extends ExternalStoreAbstract<SplitPanelState> {
  private resizeObserver?: ResizeObserver;
  private containerElement: HTMLElement | null = null;
  private resizeEventCount = 0;

  private version = __APP_VERSION__;
  public orientation: "vertical" | "horizontal" = "vertical";
  public supportsCollapse = true;
  public collapsedPaneSize = 0;
  public splitterSize = 4;

  private localStoreKey = "explorer-tree-layout";
  private store: StorageAdapter<SplitPanelLayout>;
  private config?: SplitPanelLayout;

  private initialized = false;

  // for debug only
  private debug = false;
  private _panelRefs?: RefObject<(HTMLDivElement | null)[]>;

  private persistLayout = false;

  private availableSpace = 0;
  id: string;

  constructor({ id, config, persistLayout }: SplitPanelServiceOptions) {
    super({} as SplitPanelState);
    this.config = config;
    this.version = config.version ?? this.version;
    this.id = id;

    this.localStoreKey = `${this.localStoreKey}:${id}`;
    this.store = createLocalStorage(this.localStoreKey);
    this.persistLayout = persistLayout;

    if (!persistLayout) this.store.remove();

    this.ensureResizeObserver();
  }

  public observeContainerResize(element: HTMLElement | null) {
    if (element) {
      if (!this.resizeObserver) this.ensureResizeObserver();
      const observer = this.resizeObserver!;
      if (this.containerElement) observer.unobserve(this.containerElement);
      observer.observe(element);
    }

    this.containerElement = element;
  }

  public unobserveContainerResize() {
    if (this.containerElement && this.resizeObserver)
      this.resizeObserver.unobserve(this.containerElement);
  }

  public disposeResizeHandle() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  public load(availableSpace: number, force = false): boolean {
    if (this.initialized && availableSpace === this.availableSpace && !force) return false;
    const stored = this.store.load();
    const layout = stored?.version === this.version ? stored : this.config;
    if (!layout) return false;

    if (stored && stored.version !== this.version) this.store.remove();

    const minRequiredSpace = layout.panes.reduce((acc, panel) => acc + panel.minimumSize, 0);
    if (availableSpace < minRequiredSpace) {
      // NOTE: a min height/width in tauri is set and is more than the sum of required min
      throw new Error(
        `SplitPanel: "${this.id}" requires at least ${minRequiredSpace}px of height but only ${availableSpace}px is available.`,
      );
    }

    this.debug_assertLayout(layout, "onLoad-default-layout", false, true, true);

    this.orientation = layout.orientation;
    this.supportsCollapse = layout.supportsCollapse;
    this.collapsedPaneSize = layout.collapsedPaneSize;
    this.splitterSize = layout.splitterSize;
    this.availableSpace = availableSpace;

    const baseAvailable = layout.availableSpace;

    layout.panes.sort((a, b) => a.order - b.order);

    const state: SplitPanelState = {
      panes:
        baseAvailable === availableSpace
          ? layout.panes
          : this.scalePanes(layout.panes, baseAvailable, availableSpace),
    };

    this.debug_assertLayout(
      {
        panes: state.panes,
        collapsedPaneSize: this.collapsedPaneSize,
        splitterSize: this.splitterSize,
        availableSpace: this.availableSpace,
      },
      "onLoad-resolved-layout",
      false,
    );
    // already clones if needed and notifies
    this.setState(state);
    this.initialized = true;
    return true;
  }

  public reset() {
    this.debug_confirmPanelSizes("before-reset");
    this.store.remove();
    this.load(this.availableSpace, true);
    this.persistToStore();
  }

  public collapse(paneIndex: number) {
    if (!this.supportsCollapse) return;
    this.debug_confirmPanelSizes(`before-collapse`);
    const state = this.getState();
    const pane = state.panes[paneIndex];
    if (pane.collapsed) return;

    pane.rememberedSize = pane.size;
    pane.collapsed = true;
    pane.size = this.collapsedPaneSize;

    const releasedSpace = pane.rememberedSize - pane.size;

    const targetIndex =
      this.findClosestExpandedBelowIndex(paneIndex, state.panes) ??
      this.findClosestExpandedAboveIndex(paneIndex, state.panes);

    if (targetIndex !== undefined) {
      state.panes[targetIndex].size += releasedSpace;
    }

    this.debug_assertLayout(
      {
        panes: state.panes,
        collapsedPaneSize: this.collapsedPaneSize,
        splitterSize: this.splitterSize,
        availableSpace: this.availableSpace,
      },
      "collapse-after",
    );
    this.commit(state);
  }

  public expand(paneIndex: number) {
    if (!this.supportsCollapse) return;
    this.debug_confirmPanelSizes("before-expand");

    const state = this.getState();
    const pane = state.panes[paneIndex];
    if (!pane.collapsed) return;

    const targetSize = Math.max(pane.rememberedSize, pane.minimumSize);

    const requiredSpace = targetSize - pane.size;

    const distribution = this.reclaimSpace(paneIndex, requiredSpace, state.panes);

    for (const contributor of distribution.contributors) {
      state.panes[contributor.index].size -= contributor.space;
    }

    pane.collapsed = false;
    pane.size += distribution.recoveredSpace;

    this.debug_assertLayout(
      {
        panes: state.panes,
        collapsedPaneSize: this.collapsedPaneSize,
        splitterSize: this.splitterSize,
        availableSpace: this.availableSpace,
      },
      "expand-after",
    );

    this.commit(state);
  }

  public toggle(panelIndex: number) {
    const panel = this.getState().panes[panelIndex];

    if (panel.collapsed) this.expand(panelIndex);
    else this.collapse(panelIndex);
  }

  private ensureResizeObserver() {
    if (this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.handleContainerResizeEvent();
    });
  }

  private handleContainerResizeEvent() {
    if (!this.containerElement) return;
    this.onContainerResize(this.containerElement.clientHeight, this.containerElement.clientWidth);
  }

  public onContainerResize(containerHeight: number, containerWidth: number) {
    const prev = this.availableSpace;
    this.availableSpace = this.orientation === "vertical" ? containerHeight : containerWidth;
    if (this.availableSpace === prev) return;
    this.resizeEventCount += 1;

    const state = this.getState();

    const scaledPanes = this.scalePanes(state.panes, prev, this.availableSpace);

    this.debug_assertLayout(
      {
        panes: scaledPanes,
        collapsedPaneSize: this.collapsedPaneSize,
        splitterSize: this.splitterSize,
        availableSpace: this.availableSpace,
      },
      "resize-after",
    );

    this.commit({ panes: scaledPanes });
  }

  public isSplitterActive(splitterIndex: number): boolean {
    const state = this.getState();
    // can resize only when more than one pane is expanded
    const expandedPanes = state.panes.filter((pane) => !pane.collapsed).length;
    if (expandedPanes <= 1) return false;

    const paneAbove = state.panes[splitterIndex];
    const paneBelow = state.panes[splitterIndex + 1];

    // if both panes are expanded active
    if (!paneAbove.collapsed && !paneBelow.collapsed) {
      return true;
    }

    // if either pane is collapsed then there should be expandable space in that direction
    if (paneAbove.collapsed) {
      // refPaneIdx is the splitterIdx (see paneAbove)
      const expandedAbove = this.findClosestExpandedAboveIndex(splitterIndex, state.panes);
      if (expandedAbove !== undefined) return true;
    }

    if (paneBelow.collapsed) {
      const expandedBelow = this.findClosestExpandedBelowIndex(splitterIndex + 1, state.panes);
      if (expandedBelow !== undefined) return true;
    }

    return false;
  }

  public onDrag({ splitterIndex, last, delta: deltaVector }: OnDragArgs) {
    const state = this.getState();

    const [deltaX, deltaY] = deltaVector;

    // if delta > 0 ? Y increasing -> mouse moving down
    const delta = this.orientation === "vertical" ? deltaY : deltaX;
    const requiredSpace = Math.abs(delta);

    // no movement
    if (requiredSpace === 0) {
      if (last) this.persistToStore();
      return;
    }

    // the find method excludes current index and we need to know if the immediate neighbor is expanded
    // paneBeforeIdx = splitterIndex. or ref = paneAboveIndex + 1
    // paneAfterIdx = splitterIndex + 1, or ref = splitterIndex
    const paneAboveIdx = this.findClosestExpandedAboveIndex(splitterIndex + 1, state.panes);
    const paneBelowIdx = this.findClosestExpandedBelowIndex(splitterIndex, state.panes);
    if (paneAboveIdx === undefined && paneBelowIdx === undefined) return;
    const paneAbove = paneAboveIdx === undefined ? undefined : state.panes[paneAboveIdx];
    const paneBelow = paneBelowIdx === undefined ? undefined : state.panes[paneBelowIdx];

    // delta > 0, paneAbove expands (mouse moving down)
    // delta < 0, paneBelow expands
    const expandingPane = delta < 0 ? paneBelow : paneAbove;
    if (!expandingPane) return;

    const distribution = this.reclaimSpace(
      expandingPane.order,
      requiredSpace,
      state.panes,
      delta > 0 ? 1 : -1,
    );

    for (const contributor of distribution.contributors) {
      state.panes[contributor.index].size -= contributor.space;
    }

    expandingPane.size += distribution.recoveredSpace;
    this.setState(state);

    if (last) this.persistToStore();
  }

  public toggleDebugMode<T extends boolean>(
    enabled: T,
    panelRefs: T extends true ? RefObject<(HTMLDivElement | null)[]> : never,
  ) {
    this.debug = enabled;
    this._panelRefs = enabled ? panelRefs : undefined;
  }

  public debug_onAfterRender(actionLabel: string) {
    this.debug_confirmPanelSizes(actionLabel);
  }

  /**
   *
   * @param {number} expandingPaneIndex - The pane which is expanding
   * @param {number} requiredSpace
   * @param {SplitPaneState[]} panes - All panes in state
   * @param {-1 | 0 | 1} direction
   *    Panes that are traversed to find space
   *    -1 = lowerIndexPanes (panesAbove),
   *     0 = bothSides,
   *     1 = higherIndexPanes (panesBelow)
   *  When 0, panes with higherIndexes are used first
   * @returns {SpaceDistribution}
   */
  private reclaimSpace(
    expandingPaneIndex: number,
    requiredSpace: number,
    panes: SplitPaneState[],
    direction: 1 | -1 | 0 = 0,
  ): SpaceDistribution {
    let remainingSpace = requiredSpace;

    const distribution: SpaceDistribution = {
      contributors: [],
      recoveredSpace: 0,
    };

    // get expanded count
    const expandedPanes = panes.filter((pane) => !pane.collapsed).length;
    if (expandedPanes === 0) {
      distribution.recoveredSpace = this.getFreeSpace(panes);
      return distribution;
    }

    const indexes: number[] = [];
    const paneCount = panes.length;
    if (direction === 1 || direction === 0) {
      // push higher-indexes first
      for (let i = expandingPaneIndex + 1; i < paneCount; i++) {
        indexes.push(i);
      }
    }

    if (direction === -1 || direction === 0) {
      // push lower-index
      for (let i = expandingPaneIndex - 1; i >= 0; i--) {
        indexes.push(i);
      }
    }

    for (const i of indexes) {
      const cPane = panes[i];
      if (cPane.collapsed) continue;
      const recovered = Math.min(remainingSpace, Math.max(0, cPane.size - cPane.minimumSize));
      if (recovered > 0) {
        remainingSpace -= recovered;
        distribution.recoveredSpace += recovered;
        distribution.contributors.push({ index: i, space: recovered });
      }

      if (remainingSpace <= 0) break;
    }

    return distribution;
  }

  private commit(state: SplitPanelState) {
    this.setState(state);
    this.persistToStore();
  }

  private getFreeSpace(panes: SplitPaneState[]) {
    const occupied = panes.reduce((prev, cur) => prev + cur.size, 0);
    const usable = this.maxUsableContainerSize(this.availableSpace, panes.length);
    return usable - occupied;
  }

  /**
   * Excludes pane at refPaneIndex
   */
  private findClosestExpandedAboveIndex(refPaneIndex: number, panes: SplitPaneState[]) {
    for (let i = refPaneIndex - 1; i >= 0; i--) {
      if (!panes[i].collapsed) return i;
    }
  }

  /**
   * Excludes pane at refPaneIndex
   */
  private findClosestExpandedBelowIndex(refPaneIndex: number, panes: SplitPaneState[]) {
    for (let i = refPaneIndex + 1; i < panes.length; i++) {
      if (!panes[i].collapsed) return i;
    }
  }

  private scalePanes(panes: SplitPaneState[], fromAvailableSize: number, toAvailableSize: number) {
    const fromUsable = this.maxUsableContainerSize(fromAvailableSize, panes.length);
    const toUsable = this.maxUsableContainerSize(toAvailableSize, panes.length);

    // exclude fixed sized panels from scaling
    const collapsedSize = panes.filter((p) => p.collapsed).length * this.collapsedPaneSize;

    const fromScalable = fromUsable - collapsedSize;
    const toScalable = toUsable - collapsedSize;

    const scaledPanes: SplitPaneState[] = panes.map((pane) => {
      return {
        ...pane,
        size: pane.collapsed ? this.collapsedPaneSize : (pane.size / fromScalable) * toScalable,
      };
    });

    // ensure min
    for (const [i, pane] of scaledPanes.entries()) {
      if (pane.collapsed || pane.size >= pane.minimumSize) continue;

      const requiredSpace = pane.minimumSize - pane.size;
      const distribution = this.reclaimSpace(i, requiredSpace, scaledPanes);
      pane.size += distribution.recoveredSpace;
      for (const contributor of distribution.contributors) {
        scaledPanes[contributor.index].size -= contributor.space;
      }
    }

    return scaledPanes;
  }

  private persistToStore() {
    if (!this.persistLayout) return;
    const state = this.getState();
    const layout: SplitPanelLayout = {
      orientation: this.orientation,
      supportsCollapse: this.supportsCollapse,
      collapsedPaneSize: this.collapsedPaneSize,
      splitterSize: this.splitterSize,
      panes: state.panes,
      availableSpace: this.availableSpace,
      version: this.version,
    };
    this.store.save(layout);
  }

  private maxUsableContainerSize(available: number, panelCount: number) {
    const splitterCount = panelCount - 1;
    return available - splitterCount * this.splitterSize;
  }

  private debug_confirmPanelSizes(actionLabel: string) {
    const refs = this._panelRefs;
    if (!this.debug || !refs?.current) return;

    const state = this.getState();
    const errors: string[] = this.debug_assertLayout(
      {
        panes: state.panes,
        collapsedPaneSize: this.collapsedPaneSize,
        splitterSize: this.splitterSize,
        availableSpace: this.availableSpace,
      },
      actionLabel,
      false,
    ).map((e) => JSON.stringify(e));

    for (let i = 0; i < refs.current.length; i++) {
      const ref = refs.current[i];
      const panel = state.panes[i];
      const size = this.orientation === "vertical" ? ref?.clientHeight : ref?.clientWidth;

      if (!this.isSizeClose(panel.size, size ?? 0)) {
        errors.push(JSON.stringify({ id: panel.id, domSize: size, paneSize: panel.size }));
      }
    }
    if (errors.length > 0) {
      throw new Error(`Size mismatch: ${actionLabel}: ${errors.join("\n")}`);
    }
  }

  // is a debug only validator and already simple, the if blocks unnecessarily trigger the error
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private debug_assertLayout(
    layout: Omit<SplitPanelLayout, "supportsCollapse" | "version" | "orientation">,
    actionLabel: string,
    force = false,
    throwOnError = true,
    isConfig = false,
  ) {
    if (!this.debug && !force) return [];
    const valData = {
      // all min sizes must fit in the window - applicable onLoad
      min: 0,
      // sum of pane sizes
      used: 0,

      hasExpanded: false,
      uniqueIds: new Set<string>(),
      orderViolation: [] as { pane: SplitPaneState; expected: number; actual: number }[],
      collapsedSizeViolations: [] as SplitPaneState[],
      minSizeViolations: [] as SplitPaneState[],
      previousSizeViolations: [] as SplitPaneState[],
    };

    for (let i = 0; i < layout.panes.length; i++) {
      const pane = layout.panes[i];
      valData.min += pane.minimumSize;
      valData.used += pane.size;
      if (!pane.collapsed) valData.hasExpanded = true; // to filter if nothing is expanded

      // to check uniques
      valData.uniqueIds.add(pane.id);

      // orderViolation
      if (pane.order !== i) {
        valData.orderViolation.push({ pane, expected: i, actual: pane.order });
      }

      // ensure all collapsed panes are of configured size
      if (!isConfig && pane.collapsed && !this.isSizeClose(pane.size, layout.collapsedPaneSize)) {
        valData.collapsedSizeViolations.push(pane);
      }

      // minSize violation
      if (
        !isConfig &&
        !pane.collapsed &&
        pane.size < pane.minimumSize &&
        !this.isSizeClose(pane.size, pane.minimumSize)
      ) {
        valData.minSizeViolations.push(pane);
      }

      // prev size violation
      if (!isConfig && pane.collapsed && pane.rememberedSize < pane.minimumSize) {
        valData.previousSizeViolations.push(pane);
      }
    }

    //
    const errors: Record<string, string | number>[] = [];
    const usableSpace = layout.availableSpace - (layout.panes.length - 1) * layout.splitterSize;
    // container height has enough to accommodate all expanded panes + splitter
    // usableSpace is used instead of usedSpace + rqdSplitterSpace
    if (!isConfig && valData.min > usableSpace) {
      errors.push({
        type: "insufficientUsableSpace",
        required: valData.min,
        available: usableSpace,
      });
    }

    // allocation did not exceed usableSpace
    if (valData.used > usableSpace && !this.isSizeClose(valData.used, usableSpace)) {
      errors.push({
        type: "excessiveAllocation",
        usedSpace: valData.used,
        available: usableSpace,
      });
    } else if (valData.hasExpanded && !this.isSizeClose(valData.used, usableSpace)) {
      // if at least one expanded then allocation must match usable.
      // if none expanded it will be sum of collapsedPanelSize only
      errors.push({ type: "leavesEmptySpace", used: valData.used, available: usableSpace });
    }

    // ids are unique
    if (valData.uniqueIds.size !== layout.panes.length) {
      errors.push({ type: "duplicateIds", uniquesFound: [...valData.uniqueIds].join(", ") });
    }

    // orderViolations
    if (valData.orderViolation.length > 0) {
      errors.push({
        type: "sortOrder",
        offendingPanes: valData.orderViolation
          .map((p) => `id: ${p.pane.id}, expectedOrder: ${p.expected}, actual: ${p.actual} `)
          .join("\n"),
      });
    }

    // collapsedSizeViolations
    if (valData.collapsedSizeViolations.length > 0) {
      errors.push({
        type: "incorrectCollapseSize",
        expected: layout.collapsedPaneSize,
        offendingPanes: valData.collapsedSizeViolations
          .map((p) => `${p.id}: ${p.size}px`)
          .join(", "),
      });
    }
    // minSizeViolations
    if (valData.minSizeViolations.length > 0) {
      errors.push({
        type: "sizeLessThanMin",
        offenders: valData.minSizeViolations
          .map((p) => `${p.id}: ${p.size} (expected: ${p.minimumSize})`)
          .join(". "),
      });
    }
    // previousSizeViolations - ensures more than min
    if (valData.previousSizeViolations.length > 0) {
      errors.push({
        type: "prevSizeLessThanMin",
        offenders: valData.previousSizeViolations
          .map((p) => `${p.id}: ${p.rememberedSize} (min: ${p.minimumSize})`)
          .join(", "),
      });
    }

    if (errors.length > 0 && throwOnError) {
      throw new Error(`action: ${actionLabel}, available: ${layout.availableSpace}\n 
        ${errors.map((e) => JSON.stringify(e)).join("\n")}\n
        ${JSON.stringify(layout.panes)}`);
    }
    return errors;
  }

  private isSizeClose(left: number, right: number) {
    return Math.abs(left - right) < 1;
  }
}
