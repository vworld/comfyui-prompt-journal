import { createContext, use } from "react";

import type { DropState } from "@/context/drag-drop/types";

interface NativeImportContextValue {
  state: DropState;
}

export const NativeImportContext = createContext<NativeImportContextValue | null>(null);

/** Read import state from elsewhere in the app if you ever need to (e.g. to disable a button mid-import). */
export function useNativeImport() {
  const ctx = use(NativeImportContext);
  if (!ctx) throw new Error("useNativeImport must be used within NativeImportProvider");
  return ctx;
}
