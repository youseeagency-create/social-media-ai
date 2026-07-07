import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data");
const MEDIA_DIR = path.join(DATA_DIR, "media");

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

// Downloads an image from a (possibly signed, expiring) CDN URL and stores it
// permanently on disk, so the app no longer depends on that URL staying valid.
export async function downloadAndStoreImage(
  url: string,
  category: "thumbnails" | "avatars",
  id: string
): Promise<string> {
  if (!url) return "";

  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return "";

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = extFromContentType(contentType);

    const dir = path.join(MEDIA_DIR, category);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${id}.${ext}`), buffer);

    return `/api/media/${category}/${id}.${ext}`;
  } catch {
    return "";
  }
}
