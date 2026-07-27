import { createContext, use } from "react";

import type { UseProjectTree } from "@/components/explorer/types";

export const ExplorerTreeContext = createContext<UseProjectTree | null>(null);

export function useExplorerTree(): UseProjectTree {
  const context = use(ExplorerTreeContext);
  if (!context) {
    throw new Error("useExplorerTree must be used within an ExplorerTreeProvider");
  }
  return context;
}
