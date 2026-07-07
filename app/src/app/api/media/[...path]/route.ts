import { readFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data");
const MEDIA_DIR = path.join(DATA_DIR, "media");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(MEDIA_DIR, ...segments);

  if (!filePath.startsWith(MEDIA_DIR) || !existsSync(filePath)) {
    return new Response(null, { status: 404 });
  }

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const buffer = readFileSync(filePath);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
