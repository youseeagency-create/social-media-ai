import type { Footage } from "./types";

// Pure, dependency-free helpers shared by client and server.

export const MAX_FOOTAGE_BYTES = 500 * 1024 * 1024; // 500 MB per file

export const ALLOWED_FOOTAGE_CONTENT_TYPES = ["video/*", "image/*", "audio/*"];

// Maps a MIME type to a footage kind, or null if it isn't an allowed type.
export function kindFromContentType(contentType: string): Footage["kind"] | null {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
