import { ChevronDown, ChevronRight } from "lucide-react";

import type {
  SplitPaneHeaderRenderProps,
  SplitPaneState,
  SplitPanelLayout,
} from "@/features/split-panel/types";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function SplitPaneHeaderView({
  pane,
  orientation,
  onToggle,
  className,
  children,
}: Readonly<{
  pane: SplitPaneState;
  orientation: SplitPanelLayout["orientation"];
  onToggle: () => void;
  className?: string;
  children?: ReactNode | ((props: SplitPaneHeaderRenderProps) => ReactNode);
}>) {
  if (children !== undefined) {
    // Consumer supplied a custom <SplitPaneHeader> — resolve either form.
    return (
      <>{typeof children === "function" ? children({ pane, orientation, onToggle }) : children}</>
    );
  }

  const isCollapsedHorizontal = orientation === "horizontal" && pane.collapsed;

  return (
    <div
      className={cn(
        "flex items-center h-full shrink-0 cursor-pointer select-none bg-input/40",
        "px-1 py-1",
        "border-t border-input/80",
        "text-xs-plus text-foreground/80 font-semibold whitespace-nowrap",
        isCollapsedHorizontal && "justify-center",
        className,
      )}

      onClick={onToggle}
    >
      {pane.collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
      <span className={cn("uppercase", isCollapsedHorizontal && "-rotate-90")}>{pane.label}</span>
    </div>
  );
}
