import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type ScrollBarProps = ScrollAreaPrimitive.Scrollbar.Props & {
  /**
   * Adds a 4px gutter to the scrollbar, to give the effect in VSCode explorer.
   *
   * By default it is disabled and gets added only when this prop is set.
   *
   * `bg-color` must be set for the effect to be visible.
   */

  gutterClassName?: string;
};
export type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  scrollbarProps?: ScrollBarProps;
  horizontalScrollbarProps?: ScrollBarProps;
  enableWorkaroundForNestedScrollAreas?: boolean;
};

/**
 * Edits made;
 *  - wrapped children in `<ScrollAreaPrimitive.Content>`
 *  - accept and pass `scrollbarProps` from ScrollArea
 *  - added an option to set a 4px gutter (orientation aware) to the scrollbar
 *
 * @param param0
 * @returns
 */
function ScrollArea({
  className,
  children,
  scrollbarProps,
  horizontalScrollbarProps,
  enableWorkaroundForNestedScrollAreas = false,

  ...props
}: ScrollAreaProps) {
  // When scrollArea is nested, the child scrollArea does not get any size initially
  // and hence it does not render.
  // setting a size explicitly on contentArea gives it a temporary height,
  // but that height no longer measures actual content-height and hence no scrollbar appears
  // on first render
  // applying the size on first render and then rerendering.
  // this has to be opted in via props
  const [bootstrapContentSize, setBootstrapContentSize] = useState(
    enableWorkaroundForNestedScrollAreas,
  );

  useEffect(() => {
    if (bootstrapContentSize) {
      setBootstrapContentSize(false);
    }
  }, [bootstrapContentSize]);

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {/*
         *  Fix added as per issue described in https://github.com/shadcn-ui/ui/issues/10534
         * Affected Component, without fix - the whole explorer panels - would not show/update thumb size
         */}
        <ScrollAreaPrimitive.Content className={bootstrapContentSize ? "size-full" : ""}>
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar {...scrollbarProps} />
      {horizontalScrollbarProps && <ScrollBar {...horizontalScrollbarProps} />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBarO({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  gutterClassName,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "relative z-10 flex touch-none select-none transition-colors",
        // Vertical
        "data-vertical:h-full data-vertical:w-2.5",
        "data-vertical:border-l data-vertical:border-l-transparent",
        // Horizontal
        "data-horizontal:h-2.5 data-horizontal:flex-col",
        "data-horizontal:border-t data-horizontal:border-t-transparent",
        className,
      )}
      {...props}
    >
      {/* Opaque background + gutter to hide overflowing content underneath */}
      {gutterClassName && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 pointer-events-none",
            orientation === "vertical" ? "-left-1 w-[calc(100%+4px)]" : "-top-1 h-[calc(100%+4px)]",
            gutterClassName,
          )}
        />
      )}

      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
