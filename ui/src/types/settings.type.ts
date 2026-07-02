import type { KEYS } from "@/config/keys";
import type { SETTINGS } from "@/config/settings";

export interface ShortcutDefinition {
  /** Human-readable label shown in the settings UI. */
  label: string;

  /** Key combination that triggers the action. */
  keys: (typeof KEYS)[keyof typeof KEYS][];
}

/**
 * Map of action name -> shortcut definition.
 *
 * Example:
 *
 * {
 *   selectShot: {
 *     label: "Select Shot",
 *     keys: [KEYS.CTRL, KEYS.ALT, KEYS.S]
 *   }
 * }
 */
export type PageShortcutSettings = Record<string, ShortcutDefinition>;

/**
 * Map of page name -> page shortcuts.
 *
 * Example:
 *
 * {
 *   global: {...},
 *   createPage: {...}
 * }
 */
export type ShortcutSettings = Record<string, PageShortcutSettings>;
export interface Settings {
  settings: typeof SETTINGS;
  shortcuts: ShortcutSettings;
}
