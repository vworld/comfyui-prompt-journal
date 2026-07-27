import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import type { AlertConfig } from "@/types/alert";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppAlertDialogProps {
  currentAlert: AlertConfig | null;
}

const variantConfig = {
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    actionVariant: "default" as const,
    defaultConfirmText: "OK",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    actionVariant: "default" as const,
    defaultConfirmText: "OK",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    actionVariant: "default" as const,
    defaultConfirmText: "OK",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-500",
    actionVariant: "destructive" as const,
    defaultConfirmText: "OK",
  },
  confirm: {
    icon: AlertCircle,
    iconColor: "text-blue-500",
    actionVariant: "default" as const,
    defaultConfirmText: "Confirm",
  },
};

export function AppAlertDialog({ currentAlert }: Readonly<AppAlertDialogProps>) {
  if (!currentAlert) return null;

  function handleClose(confirmed: boolean) {
    currentAlert?.resolve(confirmed);
  }

  const { variant, options } = currentAlert;
  const config = variantConfig[variant];
  const Icon = config.icon;

  const isConfirm = variant === "confirm";
  const confirmText = options.confirmText ?? config.defaultConfirmText;
  const cancelText = options.cancelText ?? "Cancel";

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`size-5 ${config.iconColor}`} />
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
          </div>
          {options.description && (
            <AlertDialogDescription className="whitespace-pre-line">
              {Array.isArray(options.description) ? (
                <ul className="list-disc space-y-1 pl-5">
                  {options.description.map((message, index) => (
                    // eslint-disable-next-line react-x/no-array-index-key
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              ) : (
                <div className="whitespace-pre-line">{options.description}</div>
              )}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isConfirm && (
            <AlertDialogCancel
              variant={options.cancelButton?.variant ?? "outline"}
              onClick={() => handleClose(false)}
            >
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={options.actionButton?.variant ?? config.actionVariant}
            onClick={() => handleClose(true)}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
