import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

import { nativeImportQueue } from "@/context/drag-drop/lib/NativeImportQueue";

/**
 * Subscribes to Tauri's native window-level drag-drop event and translates
 * it into DropAction dispatches.
 */
export function useNativeDropListener() {
  useEffect(() => {
    let cancelled = false;
    let unListen: (() => void) | undefined;

    async function addListener() {
      unListen = await getCurrentWebviewWindow().onDragDropEvent((event) => {
        const { type } = event.payload;

        switch (type) {
          case "enter":
          case "over": {
            nativeImportQueue.onDragHover();

            break;
          }
          case "leave": {
            nativeImportQueue.onDragCancel();

            break;
          }
          case "drop": {
            nativeImportQueue.onDrop(event.payload.paths);

            break;
          }
          // No default
        }
      });

      if (cancelled) unListen();
    }

    void addListener();

    return () => {
      cancelled = true;
      unListen?.();
    };
  });
}
