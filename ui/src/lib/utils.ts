import { type ClassValue, clsx } from "clsx";

import { twMerge } from "@/styles/tw-merge-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;

  return `${Number(value.toFixed(decimals))} ${units[i]}`;
}
