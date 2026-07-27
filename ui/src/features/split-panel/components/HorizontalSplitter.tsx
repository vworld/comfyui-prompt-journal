import { type Handler, useDrag } from "@use-gesture/react";

import { cn } from "@/lib/utils";

export interface HorizontalSplitterProps {
  className?: string;

  disabled?: boolean;

  /**
   * Passed directly to useDrag().
   */
  onDrag: Handler<"drag", PointerEvent | MouseEvent | TouchEvent | KeyboardEvent>;
  height?: number;

  /**
   * Optional visual content.
   */
  children?: React.ReactNode;
}

export function HorizontalSplitter({
  className,
  disabled = false,
  onDrag,
  height = 4,
  children,
}: Readonly<HorizontalSplitterProps>) {
  const bind = useDrag(onDrag, {
    axis: "y",
    enabled: !disabled,
    threshold: 0,
    pointer: {
      touch: true,
    },
  });

  return (
    <div className={cn("relative shrink-0", className)} style={{ height: height + "px" }}>
      <div
        {...bind()}
        className={cn("absolute inset-x-0 touch-none", disabled ? "" : "cursor-n-resize")}
        style={{ top: -height, bottom: -height }}
      >
        {children}
      </div>
    </div>
  );
}
