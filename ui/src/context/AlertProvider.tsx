import { useCallback, useRef, useState } from "react";

import type { AlertConfig, AlertContextValue, AlertOptions, AlertVariant } from "@/types/alert";

import { AppAlertDialog } from "@/components/AppAlertDialog";
import { AlertContext } from "@/context/AlertContext";

export function AlertProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentAlert, setCurrentAlert] = useState<AlertConfig | null>(null);
  const queueRef = useRef<AlertConfig[]>([]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0 || currentAlert) {
      return;
    }

    const next = queueRef.current.shift()!;
    setCurrentAlert(next);
  }, [currentAlert]);

  const showAlert = useCallback(
    (variant: AlertVariant, options: AlertOptions): Promise<void> => {
      return new Promise<void>((resolve) => {
        const alertConfig: AlertConfig = {
          variant,
          options,
          resolve: () => {
            setCurrentAlert(null);
            resolve();
            processQueue();
          },
        };
        queueRef.current.push(alertConfig);
        processQueue();
      });
    },
    [processQueue],
  );

  const showConfirm = useCallback(
    (options: AlertOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const alertConfig: AlertConfig = {
          variant: "confirm",
          options,
          resolve: (value: boolean) => {
            setCurrentAlert(null);
            resolve(value);
            processQueue();
          },
        };
        queueRef.current.push(alertConfig);
        processQueue();
      });
    },
    [processQueue],
  );

  const value: AlertContextValue = {
    alert: (options) => showAlert("info", options),
    info: (options) => showAlert("info", options),
    success: (options) => showAlert("success", options),
    warning: (options) => showAlert("warning", options),
    error: (options) => showAlert("error", options),
    confirm: showConfirm,
  };

  return (
    <AlertContext value={value}>
      {children}
      <AppAlertDialog
        alert={currentAlert}
        onResolve={(value) => {
          currentAlert?.resolve(value);
          setCurrentAlert(null);
          processQueue();
        }}
      />
    </AlertContext>
  );
}
