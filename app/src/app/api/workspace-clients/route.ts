import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readWorkspaceClients, writeWorkspaceClients } from "@/lib/csv";
import type { WorkspaceClient } from "@/lib/types";

export async function GET() {
  return NextResponse.json(readWorkspaceClients());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.userId) {
    return NextResponse.json({ error: "workspaceId and userId required" }, { status: 400 });
  }

  const links = readWorkspaceClients();
  if (links.some((l) => l.workspaceId === body.workspaceId && l.userId === body.userId)) {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  const newLink: WorkspaceClient = {
    id: uuid(),
    workspaceId: body.workspaceId,
    userId: body.userId,
    createdAt: new Date().toISOString(),
  };
  links.push(newLink);
  writeWorkspaceClients(links);
  return NextResponse.json(newLink, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");

  let links = readWorkspaceClients();
  if (id) {
    links = links.filter((l) => l.id !== id);
  } else if (workspaceId && userId) {
    links = links.filter((l) => !(l.workspaceId === workspaceId && l.userId === userId));
  } else {
    return NextResponse.json({ error: "id or (workspaceId and userId) required" }, { status: 400 });
  }

  writeWorkspaceClients(links);
  return NextResponse.json({ success: true });
}
