export type DropPhase = "idle" | "hovering" | "uploading" | "results";

export type ImportItemStatus = "pending" | "uploading" | "done" | "error" | "skipped" | "queued";

export interface ImportResult {
  id: string;
}

export interface ImportItem {
  path: string;
  status: ImportItemStatus;
  result?: ImportResult;
  error?: string;
}

export type DropState =
  | { phase: "idle" }
  | { phase: "hovering" }
  | { phase: "uploading"; items: ImportItem[] }
  | { phase: "results"; items: ImportItem[] };

export type DropAction =
  | { type: "HOVER" }
  | { type: "LEAVE" }
  | { type: "DROP"; paths: string[] }
  | { type: "ITEM_UPDATE"; path: string; patch: Partial<ImportItem> }
  | { type: "ALL_DONE" }
  | { type: "DISMISS" };

export interface ServerFileMessage {
  path: string;
  status: Extract<ImportItemStatus, "done" | "error">;
  result?: ImportItem["result"];
  error?: string;
}

export interface ServerCompleteMessage {
  type: "complete";
}

export type ServerMessage = ServerFileMessage | ServerCompleteMessage;
