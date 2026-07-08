import type { InspirationItem } from "./types";

export type Platform = InspirationItem["platform"];

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Extracts the YouTube video id from watch/short/embed/youtu.be URLs.
function youtubeVideoId(u: URL): string | null {
  if (u.hostname.endsWith("youtu.be")) {
    const id = u.pathname.slice(1).split("/")[0];
    return id || null;
  }
  const v = u.searchParams.get("v");
  if (v) return v;
  // /shorts/<id> or /embed/<id>
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts[0] === "shorts" || parts[0] === "embed") return parts[1] ?? null;
  return null;
}

// Detects the platform from a URL and, where trivially derivable (YouTube),
// a thumbnail URL. No network calls / scraping — that's a later stage.
export function detectPlatform(url: string): { platform: Platform; thumbnailUrl: string | null } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { platform: "other", thumbnailUrl: null };
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
    const id = youtubeVideoId(u);
    return {
      platform: "youtube",
      thumbnailUrl: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
    };
  }
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    return { platform: "instagram", thumbnailUrl: null };
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return { platform: "tiktok", thumbnailUrl: null };
  }
  return { platform: "other", thumbnailUrl: null };
}
