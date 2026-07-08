import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireWorkspaceAccess } from "@/lib/auth";
import { listFootage, createFootage, getFootageById, deleteFootage } from "@/lib/db";
import { kindFromContentType, MAX_FOOTAGE_BYTES } from "@/lib/footage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listFootage(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.name || !body.url || !body.contentType) {
    return NextResponse.json({ error: "workspaceId, name, url and contentType required" }, { status: 400 });
  }
  // Derive kind server-side rather than trusting the client.
  const kind = kindFromContentType(body.contentType);
  if (!kind) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;
  if (sizeBytes > MAX_FOOTAGE_BYTES) {
    return NextResponse.json({ error: "File exceeds the size limit" }, { status: 400 });
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const item = await createFootage({
    workspaceId: body.workspaceId,
    name: String(body.name).slice(0, 500),
    url: body.url,
    contentType: body.contentType,
    sizeBytes,
    kind,
    createdBy: user.id,
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await getFootageById(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(item.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (item.url.includes(".blob.vercel-storage.com")) {
    try {
      await del(item.url);
    } catch {
      // ignore — don't block the row delete if the blob is already gone
    }
  }

  await deleteFootage(id);
  return NextResponse.json({ success: true });
}
