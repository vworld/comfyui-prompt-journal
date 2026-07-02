import { type ReactNode, useSyncExternalStore } from "react";

import { SettingsContext } from "@/context/SettingsContext";
import { settingsStore } from "@/lib/settings-store";

export interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: Readonly<SettingsProviderProps>) {
  const settings = useSyncExternalStore(
    settingsStore.subscribe.bind(settingsStore),
    settingsStore.getState.bind(settingsStore),
  );

  return <SettingsContext value={settings}>{children}</SettingsContext>;
}
