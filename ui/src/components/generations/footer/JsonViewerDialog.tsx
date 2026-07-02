import { Copy } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { writeToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export interface JsonViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  value: object;

  title?: string;
  description?: string;

  copyLabel?: string;

  className?: string;
}

export function JsonViewerDialog({
  open,
  onOpenChange,
  value,
  title = "JSON",
  description,
  copyLabel = "Copy JSON",
  className = "",
}: Readonly<JsonViewerDialogProps>) {
  const formattedJson = useMemo(() => JSON.stringify(value, null, 2), [value]);

  async function copy() {
    await writeToClipboard(formattedJson);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex h-[85vh] max-h-[90vh] max-w-[85vw] flex-col", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Textarea
          readOnly
          value={formattedJson}
          spellCheck={false}
          className="
            min-h-0
            flex-1
            resize-none
            font-mono
            text-sm
            tab-2
          "
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void copy()}>
            <Copy className="size-4" />
            {copyLabel}
          </Button>

          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
