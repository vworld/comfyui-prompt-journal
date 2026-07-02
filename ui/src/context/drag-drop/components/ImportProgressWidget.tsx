import { CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react";

import type { DropState, ImportItemStatus } from "@/context/drag-drop/types";

import { fileNameFromPath } from "@/context/drag-drop/lib/file-from-path";

interface ImportProgressWidgetProps {
  state: DropState;
}

export function ImportProgressWidget({ state }: Readonly<ImportProgressWidgetProps>) {
  if (state.phase !== "uploading") return null;

  const total = state.items.length;
  const settled = state.items.filter((item) =>
    ["done", "error", "skipped"].includes(item.status),
  ).length;

  return (
    <div className="fixed bottom-5 right-5 z-998 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="font-heading text-xxs font-semibold uppercase tracking-wider text-muted-foreground">
          Importing
        </span>
        <span className="font-mono text-xs text-foreground">
          {settled}/{total}
        </span>
      </div>

      <ul className="max-h-48 divide-y divide-border overflow-y-auto">
        {state.items.map((item) => (
          <li key={item.path} className="flex items-center gap-2 px-3.5 py-2">
            <StatusIcon status={item.status} />
            <span className="truncate font-mono text-xs text-foreground" title={item.path}>
              {fileNameFromPath(item.path)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: Readonly<{ status: ImportItemStatus }>) {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (status) {
    case "done": {
      return <CheckCircle2 className="size-3.5 shrink-0 text-primary" />;
    }
    case "error": {
      return <XCircle className="size-3.5 shrink-0 text-destructive" />;
    }
    case "skipped": {
      return <SkipForward className="size-3.5 shrink-0 text-muted-foreground" />;
    }
    case "uploading": {
      return <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />;
    }
    default: {
      return <div className="size-3.5 shrink-0 rounded-full border border-border" />;
    }
  }
}
