import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireWorkspaceAccess } from "@/lib/auth";
import { listNotes, createNote, getNoteById, deleteNote } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listNotes(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || (body.kind !== "text" && body.kind !== "voice")) {
    return NextResponse.json({ error: "workspaceId and kind (text|voice) required" }, { status: 400 });
  }
  if (body.kind === "text" && !body.body?.trim()) {
    return NextResponse.json({ error: "A text note needs a body" }, { status: 400 });
  }
  if (body.kind === "voice" && !body.audioUrl) {
    return NextResponse.json({ error: "A voice note needs an audioUrl" }, { status: 400 });
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const note = await createNote({
    workspaceId: body.workspaceId,
    kind: body.kind,
    title: body.title?.trim() || null,
    body: body.kind === "text" ? body.body.trim() : null,
    audioUrl: body.kind === "voice" ? body.audioUrl : null,
    audioDurationSeconds:
      typeof body.audioDurationSeconds === "number" ? Math.round(body.audioDurationSeconds) : null,
    createdBy: user.id,
  });
  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const note = await getNoteById(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(note.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (note.kind === "voice" && note.audioUrl) {
    // Best-effort: don't fail the delete if the blob is already gone.
    try {
      await del(note.audioUrl);
    } catch {
      // ignore
    }
  }

  await deleteNote(id);
  return NextResponse.json({ success: true });
}
