import type { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export type ButtonVariant = VariantProps<typeof buttonVariants>;

export interface AlertOptions {
  title: string;
  description?: string | string[];
  confirmText?: string;
  cancelText?: string;
  actionButton?: ButtonVariant;
  cancelButton?: ButtonVariant;
}

export type AlertVariant = "info" | "success" | "warning" | "error" | "confirm";

export interface AlertConfig {
  variant: AlertVariant;
  options: AlertOptions;
  resolve: (value: boolean) => void;
}

export interface ReportErrorOptions {
  /**
   * @default "dialog"
   */
  surface?: "dialog" | "toast" | "none";
  /**
   * If provided, the resolved error message is pushed to the description.
   *
   * Default is to show the error message in the title.
   */
  title?: string;
  /**
   * If title is provided, the resolved error message is shown in the description;
   * otherwise, no description is shown.
   *
   * Ignored for `toast`
   */
  description?: string;
  /**
   * Ignores AbortError caused by calling abortController.abort()
   */
  ignoreAbort?: boolean;
}

export interface AlertContextValue {
  alert: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  confirm: (options: AlertOptions) => Promise<boolean>;
  info: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  success: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  warning: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  error: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  reportError: (error: unknown, options?: ReportErrorOptions) => Promise<void>;
}
