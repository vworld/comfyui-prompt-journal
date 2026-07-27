import { type Handler, useDrag } from "@use-gesture/react";

import { cn } from "@/lib/utils";

export interface VerticalSplitterProps {
  className?: string;

  disabled?: boolean;

  /**
   * Passed directly to useDrag().
   */
  onDrag: Handler<"drag", PointerEvent | MouseEvent | TouchEvent | KeyboardEvent>;
  width?: number;

  /**
   * Optional visual content.
   */
  children?: React.ReactNode;
}

export function VerticalSplitter({
  className,
  disabled = false,
  onDrag,
  width = 4,
  children,
}: Readonly<VerticalSplitterProps>) {
  const bind = useDrag(onDrag, {
    axis: "x",
    enabled: !disabled,
    threshold: 0,
    pointer: {
      touch: true,
    },
  });

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: width + "px" }}>
      <div
        {...bind()}
        className={cn("absolute inset-y-0 touch-none", disabled ? "" : "cursor-e-resize")}
        style={{ left: -width, right: -width }}
      >
        {children}
      </div>
    </div>
  );
}
