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

export interface AlertContextValue {
  alert: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  confirm: (options: AlertOptions) => Promise<boolean>;
  info: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  success: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  warning: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
  error: (options: Omit<AlertOptions, "cancelText">) => Promise<void>;
}
