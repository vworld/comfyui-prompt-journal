import { ArrowUpRight, CheckCircle2, SkipForward, XCircle } from "lucide-react";
import { useNavigate } from "react-router";

import type { DropState, ImportItemStatus } from "@/context/drag-drop/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileNameFromPath } from "@/context/drag-drop/lib/file-from-path";

interface ImportResultsDialogProps {
  state: DropState;
  onDismiss: () => void;
}

export function ImportResultsDialog({ state, onDismiss }: Readonly<ImportResultsDialogProps>) {
  const navigate = useNavigate();

  const open = state.phase === "results";
  const items = state.phase === "results" ? state.items : [];

  const doneCount = items.filter((item) => item.status === "done").length;
  const skippedCount = items.length - doneCount;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import complete</DialogTitle>
          <DialogDescription>
            {doneCount} imported
            {skippedCount > 0 ? `, ${skippedCount} skipped` : ""}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {items.map((item) => (
            <li key={item.path} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <ResultStatusIcon status={item.status} />
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">
                    {fileNameFromPath(item.path)}
                  </p>
                  {item.error && (
                    <p className="truncate text-xxs text-muted-foreground">{item.error}</p>
                  )}
                </div>
              </div>

              {item.status === "done" && item.result && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1"
                  onClick={() => {
                    onDismiss();
                    void navigate(`/review-console/${item.result?.id}`);
                  }}
                >
                  View
                  <ArrowUpRight className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="secondary" onClick={onDismiss}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultStatusIcon({ status }: Readonly<{ status: ImportItemStatus }>) {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (status) {
    case "done": {
      return <CheckCircle2 className="size-4 shrink-0 text-primary" />;
    }
    case "skipped": {
      return <SkipForward className="size-4 shrink-0 text-muted-foreground" />;
    }

    default: {
      return <XCircle className="size-4 shrink-0 text-destructive" />;
    }
  }
}
