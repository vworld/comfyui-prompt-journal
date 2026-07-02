import type {
  DropState,
  ImportItem,
  ServerCompleteMessage,
  ServerMessage,
} from "@/context/drag-drop/types";

import { ExternalStoreAbstract } from "@/lib/external-store-abstract";

const API_BASE_DOMAIN: string =
  (import.meta.env.API_BASE_DOMAIN as string | undefined) ?? "localhost:8000";
const UPLOAD_WS_URL = `ws://${API_BASE_DOMAIN}/api/ws/upload-native`;

const initialState: DropState = { phase: "idle" };

class NativeImportQueue extends ExternalStoreAbstract<DropState> {
  // Guards runLoop from being kicked off twice concurrently.
  private processing = false;

  constructor() {
    super(initialState);
  }

  // ---- Drag lifecycle ----

  onDragHover() {
    if (this.getState().phase === "idle") {
      this.setState({ phase: "hovering" });
    }
  }

  onDragCancel() {
    if (this.getState().phase === "hovering") {
      this.setState({ phase: "idle" });
    }
  }

  // ---- Drop / queueing ----

  onDrop(paths: string[]) {
    this.update((state) => {
      const incoming: ImportItem[] = paths.map((path) => ({
        path,
        status: state.phase === "uploading" ? "queued" : "pending",
      }));

      if (state.phase === "uploading") {
        return { ...state, items: [...state.items, ...incoming] };
      }
      // A drop always means "start (or resume) uploading"
      return { phase: "uploading", items: incoming };
    });

    void this.runLoop(); // no-op if a batch loop is already running
  }

  dismiss() {
    if (this.getState().phase === "results") {
      this.setState({ phase: "idle" });
    }
  }

  // ---- Internal batch loop ----

  private async runLoop() {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      const state = this.getState();
      if (state.phase !== "uploading") break;

      const nextBatch = state.items.filter(
        (item) => item.status === "pending" || item.status === "queued",
      );
      if (nextBatch.length === 0) break;

      this.markItems(
        nextBatch.map((item) => item.path),
        { status: "uploading" },
      );
      await this.runBatch(nextBatch.map((item) => item.path));
      // loop back around — re-reads live state, so anything queued
      // mid-batch (via onDrop) is picked up here without extra signaling
    }

    this.processing = false;
    if (this.getState().phase === "uploading") {
      this.update((state) => {
        if (state.phase !== "uploading") return state;
        return { phase: "results", items: state.items };
      });
    }
  }

  private runBatch(paths: string[]): Promise<void> {
    return new Promise((resolve) => {
      const ws = new WebSocket(UPLOAD_WS_URL);
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ paths }));
      });

      ws.addEventListener("message", (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data as string) as ServerMessage;
        } catch {
          return; // malformed frame — ignore rather than crash the batch
        }
        if (this.isCompleteMessage(msg)) {
          finish();
          ws.close();
          return;
        }
        this.markItems([msg.path], {
          status: msg.status,
          result: msg.result,
          error: msg.error,
        });
      });

      ws.addEventListener("error", () => {
        // "close" always follows — actual handling lives there
      });

      ws.addEventListener("close", () => {
        if (!settled) {
          const state = this.getState();
          const stillInFlight =
            state.phase === "uploading"
              ? paths.filter(
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  (path) => state.items.find((item) => item.path === path)?.status === "uploading",
                )
              : paths;
          this.markItems(stillInFlight, {
            status: "error",
            error: "Connection lost before import finished",
          });
        }
        finish();
      });
    });
  }

  private markItems(paths: string[], patch: Partial<ImportItem>) {
    const pathSet = new Set(paths);
    this.update((state) => {
      if (state.phase !== "uploading" && state.phase !== "results") return state;
      state.items = state.items.map((item) =>
        pathSet.has(item.path) ? { ...item, ...patch } : item,
      );
      return state;
    });
  }

  private isCompleteMessage(msg: ServerMessage): msg is ServerCompleteMessage {
    return "type" in msg && msg.type === "complete";
  }
}

export const nativeImportQueue = new NativeImportQueue();
