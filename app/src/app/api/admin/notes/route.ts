import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAdminNotes, createAdminNote, getAdminNoteById, deleteAdminNote } from "@/lib/db";

// Admin-only private notes about a client/workspace. Gated by proxy.ts
// (`/api/admin/*`) and re-checked here — never exposed to clients.
async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  return NextResponse.json(await listAdminNotes(workspaceId));
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  if (!body.workspaceId || !body.body?.trim()) {
    return NextResponse.json({ error: "workspaceId and body required" }, { status: 400 });
  }
  const note = await createAdminNote({
    workspaceId: body.workspaceId,
    body: String(body.body).trim().slice(0, 5000),
    createdBy: admin.id,
  });
  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await getAdminNoteById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteAdminNote(id);
  return NextResponse.json({ success: true });
}
