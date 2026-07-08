import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireWorkspaceAccess } from "@/lib/auth";
import { listInspiration, createInspiration, getInspirationById, deleteInspiration } from "@/lib/db";
import { detectPlatform, isValidHttpUrl } from "@/lib/inspiration";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listInspiration(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.url) {
    return NextResponse.json({ error: "workspaceId and url required" }, { status: 400 });
  }
  if (!isValidHttpUrl(body.url)) {
    return NextResponse.json({ error: "Enter a valid http(s) URL" }, { status: 400 });
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { platform, thumbnailUrl } = detectPlatform(body.url);
  // YouTube thumbnails are derived on the spot; Instagram/TikTok get scraped
  // asynchronously via /api/inspiration/thumbnail, so they start as "pending".
  const thumbnailStatus = thumbnailUrl
    ? "ready"
    : platform === "instagram" || platform === "tiktok"
      ? "pending"
      : "none";
  const item = await createInspiration({
    workspaceId: body.workspaceId,
    url: body.url,
    platform,
    thumbnailUrl,
    thumbnailStatus,
    createdBy: user.id,
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await getInspirationById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(item.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Clean up a Blob-stored thumbnail (IG/TikTok). YouTube thumbnails live on
  // img.youtube.com and aren't ours to delete.
  if (item.thumbnailUrl?.includes(".blob.vercel-storage.com")) {
    try {
      await del(item.thumbnailUrl);
    } catch {
      // ignore
    }
  }

  await deleteInspiration(id);
  return NextResponse.json({ success: true });
}
