import { KEYS } from "./keys";

import type { ShortcutSettings } from "@/types/settings.type";

export const SHORTCUTS: ShortcutSettings = {
  global: {
    search: {
      label: "Global Search",
      keys: [KEYS.CTRL, KEYS.K],
    },
  },
  createPage: {
    selectShot: {
      label: "Select Shot",
      keys: [KEYS.CTRL, KEYS.ALT, KEYS.S],
    },
  },
};
