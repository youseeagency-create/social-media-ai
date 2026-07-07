import { NextResponse } from "next/server";
import { readVideos, writeVideos } from "@/lib/csv";
import { downloadAndStoreImage } from "@/lib/media";
import { scrapePostThumbnail } from "@/lib/apify";

export const maxDuration = 300;

// One-off migration: existing rows store a raw Instagram CDN URL, which is
// signed and expires. First try re-downloading the stored URL directly; if
// that's dead, fall back to re-scraping the post via Apify to get a fresh
// URL, then store it locally so it stops depending on any signature staying valid.
export async function POST() {
  const videos = readVideos();
  const toBackfill = videos.filter((v) => v.thumbnail.startsWith("http"));

  let succeeded = 0;
  let rescraped = 0;
  let failed = 0;

  for (const video of toBackfill) {
    let local = await downloadAndStoreImage(video.thumbnail, "thumbnails", video.id);

    if (!local) {
      try {
        const freshUrl = await scrapePostThumbnail(video.link);
        if (freshUrl) {
          local = await downloadAndStoreImage(freshUrl, "thumbnails", video.id);
          if (local) rescraped++;
        }
      } catch {
        // leave local empty — counted as failed below
      }
    }

    if (local) {
      video.thumbnail = local;
      succeeded++;
    } else {
      failed++;
    }
  }

  if (toBackfill.length > 0) writeVideos(videos);

  return NextResponse.json({ attempted: toBackfill.length, succeeded, rescraped, failed });
}
