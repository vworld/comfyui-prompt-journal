import { type ReactNode, useSyncExternalStore } from "react";

import type { ImportResult } from "@/context/drag-drop/types";

import { NativeImportContext } from "@/context/drag-drop/NativeImportContext";
import { ImportOverlay } from "@/context/drag-drop/components/ImportOverlay";
import { ImportProgressWidget } from "@/context/drag-drop/components/ImportProgressWidget";
import { ImportResultsDialog } from "@/context/drag-drop/components/ImportResultsDialog";
import { useNativeDropListener } from "@/context/drag-drop/hooks/use-native-drop-listener";
import { nativeImportQueue } from "@/context/drag-drop/lib/NativeImportQueue";

interface NativeImportProviderProps {
  children?: ReactNode;
  /** Called when the user picks "View" on an imported item in the results dialog. */
  onNavigate?: (result: ImportResult) => void;
}

/**
 * Owns the entire native file-import feature end to end: drag detection,
 * upload orchestration, and all three UI surfaces (full overlay while
 * hovering, corner widget while uploading, results dialog when done).
 */
export function NativeImportProvider({
  children,
  onNavigate,
}: Readonly<NativeImportProviderProps>) {
  const state = useSyncExternalStore(
    nativeImportQueue.subscribe.bind(nativeImportQueue),
    nativeImportQueue.getState.bind(nativeImportQueue),
  );

  useNativeDropListener();

  return (
    <NativeImportContext value={{ state }}>
      {children}
      <ImportOverlay phase={state.phase} />
      <ImportProgressWidget state={state} />
      <ImportResultsDialog
        state={state}
        onDismiss={() => nativeImportQueue.dismiss()}
        onNavigate={onNavigate}
      />
    </NativeImportContext>
  );
}
