import { NextResponse } from "next/server";
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, setWorkspaceArchived } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await getWorkspaces());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const newWorkspace = await createWorkspace(body.name);
  return NextResponse.json(newWorkspace, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }
  const updated = await updateWorkspace(body.id, { name: body.name });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// Archive / unarchive (soft deactivate). Admin-only via proxy.ts.
export async function PATCH(request: Request) {
  const body = await request.json();
  if (!body.id || typeof body.archived !== "boolean") {
    return NextResponse.json({ error: "id and archived (boolean) required" }, { status: 400 });
  }
  const updated = await setWorkspaceArchived(body.id, body.archived);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteWorkspace(id);
  return NextResponse.json({ success: true });
}
