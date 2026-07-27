import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface JsonImportPanelProps<T = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;
  placeholder?: string;
  importLabel?: string;
  loading?: boolean;
  className?: string;

  /**
   * Optional shape validation.
   * Return null if valid, otherwise return an error message.
   */
  validate?: (json: JsonValue) => string[] | null;

  onImport: (json: T) => void | Promise<void>;
}

type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export function JsonImportPanel<T = unknown>({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Paste JSON here...",
  importLabel = "Import",
  loading = false,
  className,
  validate,
  onImport,
}: Readonly<JsonImportPanelProps<T>>) {
  const [text, setText] = useState("");

  const validation = useMemo(() => {
    if (!text.trim()) {
      return {
        parsed: null,
        valid: false,
        messages: null,
      };
    }

    try {
      const parsed: JsonValue = JSON.parse(text) as JsonValue;

      const validationError = validate?.(parsed);

      if (validationError && validationError.length > 0) {
        return {
          parsed,
          valid: false,
          messages: validationError,
        };
      }

      return {
        parsed,
        valid: true,
        messages: null,
      };
    } catch (error) {
      return {
        parsed: null,
        valid: false,
        messages: [error instanceof Error ? error.message : "Invalid JSON."],
      };
    }
  }, [text, validate]);

  const formatJson = useCallback(() => {
    if (!validation.parsed) return;

    setText(JSON.stringify(validation.parsed, null, 2));
  }, [validation.parsed]);

  const clear = useCallback(() => {
    setText("");
  }, []);

  const importJson = useCallback(async () => {
    if (!validation.valid || !validation.parsed) return;

    await onImport(validation.parsed as T);
    setText("");
  }, [onImport, validation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex h-[85vh] max-h-[90vw] max-w-[85vw] flex-col", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={cn("flex h-full w-full flex-col gap-4")}>
          <div className="relative flex-1 overflow-hidden rounded-md border">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              wrap="off"
              className={cn(
                "h-full w-full resize-none",
                "bg-background",
                "font-mono text-sm",
                "outline-none",
                "p-4",
                "tab-2",
              )}
              onKeyDown={(e) => {
                if (!((e.ctrlKey || e.metaKey) && e.key === "Enter")) {
                  return;
                }

                e.preventDefault();

                void importJson();
              }}
            />
          </div>

          <div className="min-h-6 text-sm">
            {text.trim() ? (
              validation.valid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="size-4" />
                  <span>Valid JSON</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <ul className="list-disc space-y-1 pl-4">
                    {validation.messages?.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )
            ) : null}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={formatJson} disabled={!validation.parsed}>
                Format
              </Button>

              <Button variant="outline" onClick={clear} disabled={!text}>
                Clear
              </Button>
            </div>

            <Button onClick={() => void importJson()} disabled={!validation.valid || loading}>
              {importLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
