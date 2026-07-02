import type { Settings } from "@/types/settings.type";

import { SETTINGS } from "@/config/settings";
import { SHORTCUTS } from "@/config/shortcuts";
import { ExternalStoreAbstract } from "@/lib/external-store-abstract";

class SettingsStore extends ExternalStoreAbstract<Settings> {
  constructor() {
    super({ settings: SETTINGS, shortcuts: SHORTCUTS });
  }
}

export const settingsStore = new SettingsStore();
