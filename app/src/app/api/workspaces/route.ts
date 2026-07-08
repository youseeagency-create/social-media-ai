import { NextResponse } from "next/server";
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from "@/lib/db";

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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteWorkspace(id);
  return NextResponse.json({ success: true });
}
