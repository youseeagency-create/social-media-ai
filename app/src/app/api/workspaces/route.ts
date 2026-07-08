import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readWorkspaces, writeWorkspaces } from "@/lib/csv";
import type { Workspace } from "@/lib/types";

export async function GET() {
  return NextResponse.json(readWorkspaces());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const workspaces = readWorkspaces();
  const newWorkspace: Workspace = {
    id: uuid(),
    name: body.name,
    createdAt: new Date().toISOString(),
  };
  workspaces.push(newWorkspace);
  writeWorkspaces(workspaces);
  return NextResponse.json(newWorkspace, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const workspaces = readWorkspaces();
  const index = workspaces.findIndex((w) => w.id === body.id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  workspaces[index] = { ...workspaces[index], ...body };
  writeWorkspaces(workspaces);
  return NextResponse.json(workspaces[index]);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const filtered = readWorkspaces().filter((w) => w.id !== id);
  writeWorkspaces(filtered);
  return NextResponse.json({ success: true });
}
