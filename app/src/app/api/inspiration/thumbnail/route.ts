import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { getInspirationById, updateInspirationThumbnail } from "@/lib/db";
import { resolveThumbnailSourceUrl, storeImageToBlob } from "@/lib/thumbnails";

// Scraping (Apify sync) can take a while, so give it room beyond the default.
export const maxDuration = 60;

// Scrapes and persists the thumbnail for one Instagram/TikTok inspiration item.
// Idempotent-ish: only acts on items still needing a thumbnail; any failure
// (private/deleted post, rate limit, timeout) marks the item "failed" and the
// UI keeps its platform badge.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await getInspirationById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(item.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Nothing to do for platforms without scrapable thumbnails, or if already resolved.
  if ((item.platform !== "instagram" && item.platform !== "tiktok") || item.thumbnailStatus === "ready") {
    return NextResponse.json(item);
  }

  try {
    const sourceUrl = await resolveThumbnailSourceUrl(item.platform, item.url);
    const blobUrl = sourceUrl
      ? await storeImageToBlob(sourceUrl, `inspiration/${item.workspaceId}/${item.id}`)
      : null;

    const updated = await updateInspirationThumbnail(id, {
      thumbnailUrl: blobUrl,
      thumbnailStatus: blobUrl ? "ready" : "failed",
    });
    return NextResponse.json(updated ?? item);
  } catch {
    const updated = await updateInspirationThumbnail(id, { thumbnailStatus: "failed" });
    return NextResponse.json(updated ?? item);
  }
}
