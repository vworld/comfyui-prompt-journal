import { createContext, use } from "react";

import type { Settings } from "@/types/settings.type";

export const SettingsContext = createContext<Settings | null>(null);

export function useSettings(): Settings {
  const settings = use(SettingsContext);

  if (settings === null) {
    throw new Error("useSettings must be used within a SettingsProvider.");
  }

  return settings;
}
