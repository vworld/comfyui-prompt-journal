import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  AlertConfig,
  AlertContextValue,
  AlertOptions,
  AlertVariant,
  ReportErrorOptions,
} from "@/types/alert";

import { ApiError } from "@/api/client";
import { AppAlertDialog } from "@/components/shared/AppAlertDialog";
import { AlertContext } from "@/context/AlertContext";

export function AlertProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);
  const queueRef = useRef<AlertConfig[]>([]);

  const ensureAlertVisible = useCallback(() => {
    setCurrentAlert((prev) => prev ?? queueRef.current.shift() ?? null);
  }, []);

  const advance = useCallback(() => {
    setCurrentAlert(() => queueRef.current.shift() ?? null);
  }, []);

  const showAlert = useCallback(
    (variant: AlertVariant, options: AlertOptions): Promise<void> => {
      return new Promise<void>((resolve) => {
        const alertConfig: AlertConfig = {
          variant,
          options,
          resolve: () => {
            resolve();
            advance();
          },
        };
        queueRef.current.push(alertConfig);
        ensureAlertVisible();
      });
    },
    [advance, ensureAlertVisible],
  );

  const showConfirm = useCallback(
    (options: AlertOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const alertConfig: AlertConfig = {
          variant: "confirm",
          options,
          resolve: (value: boolean) => {
            resolve(value);
            advance();
          },
        };
        queueRef.current.push(alertConfig);
        ensureAlertVisible();
      });
    },
    [advance, ensureAlertVisible],
  );

  const alert = useCallback((options: AlertOptions) => showAlert("info", options), [showAlert]);

  const success = useCallback(
    (options: AlertOptions) => showAlert("success", options),
    [showAlert],
  );
  const warning = useCallback(
    (options: AlertOptions) => showAlert("warning", options),
    [showAlert],
  );

  const error = useCallback((options: AlertOptions) => showAlert("error", options), [showAlert]);

  const reportError = useCallback(
    async (error: unknown, options?: ReportErrorOptions): Promise<void> => {
      const { surface = "dialog", ignoreAbort = true, title, description } = options ?? {};

      if (!error || surface === "none") return;

      let errMsg: string | undefined;

      if (error instanceof DOMException && error.name === "AbortError") {
        if (ignoreAbort) return;
        errMsg = `${error.message}${"reason" in error && typeof error.reason === "string" ? " " + error.reason : ""}`;
      } else if (error instanceof ApiError) {
        errMsg = `${error.message} (Status: ${error.status})`;
      } else if (error instanceof Error) {
        errMsg = error.message;
      } else if (typeof error === "string") {
        errMsg = error;
      }

      errMsg ??= "Something went wrong";

      const errTitle = title ?? errMsg;
      const errDescription = description ?? (title ? errMsg : undefined);

      if (surface === "toast") {
        toast.error(errTitle, { description: errDescription });
        return;
      }

      return showAlert("error", {
        title: errTitle,
        description: errDescription,
      });
    },
    [showAlert],
  );

  const value: AlertContextValue = useMemo(
    () => ({
      alert,
      info: alert,
      success,
      warning,
      error,
      reportError,
      confirm: showConfirm,
    }),
    [alert, error, reportError, showConfirm, success, warning],
  );

  return (
    <AlertContext value={value}>
      {children}
      <AppAlertDialog currentAlert={currentAlert} />
    </AlertContext>
  );
}
