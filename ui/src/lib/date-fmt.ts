import { format, formatDistanceToNow } from "date-fns";

export function formatDate(timestamp: number | Date): string {
  return format(timestamp, "dd-MMM-yy HH:mm:ss");
}

export function elapsedToNow(now?: Date | number): string {
  const n = (typeof now === "number" ? new Date(now) : now) ?? new Date(Date.now());
  return formatDistanceToNow(n);
}
