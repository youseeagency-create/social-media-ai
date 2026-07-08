import { put } from "@vercel/blob";
import { scrapePostThumbnail } from "./apify";
import type { InspirationItem } from "./types";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// TikTok's public oEmbed endpoint returns a cover image with no auth/scraping.
async function fetchTiktokThumbnailUrl(url: string): Promise<string> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { thumbnail_url?: string };
  return data.thumbnail_url || "";
}

// Resolves a (short-lived, signed) source thumbnail URL for a saved link.
// Instagram uses the existing Apify scraper; TikTok uses free oEmbed.
export async function resolveThumbnailSourceUrl(
  platform: InspirationItem["platform"],
  url: string
): Promise<string> {
  if (platform === "instagram") return scrapePostThumbnail(url);
  if (platform === "tiktok") return fetchTiktokThumbnailUrl(url);
  return "";
}

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

// Downloads an image from a (possibly expiring) CDN URL and stores it in Vercel
// Blob, returning the persistent Blob URL, or null on any failure.
export async function storeImageToBlob(sourceUrl: string, pathPrefix: string): Promise<string | null> {
  if (!sourceUrl) return null;
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const blob = await put(`${pathPrefix}.${extFromContentType(contentType)}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  } catch {
    return null;
  }
}
