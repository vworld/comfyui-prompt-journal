import { createContext, use } from "react";

import type { AlertContextValue } from "@/types/alert";

export const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const context = use(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
