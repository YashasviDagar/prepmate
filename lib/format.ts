import { formatDistanceToNow } from "date-fns";

export function getInitials(
  name?: string | null,
  email?: string | null,
): string {
  const source = name?.trim() || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
}

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatPercent(value?: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}

/** Renders a 0–100 score as a one-decimal string. */
export function formatScore(value?: number | null): string {
  if (value == null) return "—";
  return value.toFixed(1);
}
