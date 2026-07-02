import type { SETTINGS } from "@/config/settings";

import { settingsStore } from "@/lib/settings-store";

class Logger {
  private settings: typeof SETTINGS.logging;
  private settingsStore = settingsStore;
  private unsubscribe?: () => void;

  constructor() {
    this.settings = this.settingsStore.getState().settings.logging;
    this.unsubscribe = this.settingsStore.subscribe(this.updateSettings);
  }

  destroy() {
    if (!this.unsubscribe) return;

    this.unsubscribe();
    this.unsubscribe = undefined;
  }

  api(...args: unknown[]): void {
    if (!this.settings.api) return;
    console.log("[API]", ...args);
  }

  info(...args: unknown[]): void {
    if (!this.settings.info) return;
    console.info(...args);
  }

  warn(...args: unknown[]): void {
    if (!this.settings.warn) return;
    console.warn(...args);
  }

  error(...args: unknown[]): void {
    if (!this.settings.error) return;
    console.error(...args);
  }

  private updateSettings = () => {
    this.settings = this.settingsStore.getState().settings.logging;
  };
}

export const logger = new Logger();
