import { NextResponse } from "next/server";
import {
  listWorkspaceClients,
  getWorkspaceClientByPair,
  createWorkspaceClient,
  deleteWorkspaceClientById,
  deleteWorkspaceClientByPair,
} from "@/lib/db";

export async function GET() {
  return NextResponse.json(await listWorkspaceClients());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.userId) {
    return NextResponse.json({ error: "workspaceId and userId required" }, { status: 400 });
  }

  const existing = await getWorkspaceClientByPair(body.workspaceId, body.userId);
  if (existing) {
    return NextResponse.json({ error: "Already assigned" }, { status: 409 });
  }

  const newLink = await createWorkspaceClient(body.workspaceId, body.userId);
  return NextResponse.json(newLink, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");

  if (id) {
    await deleteWorkspaceClientById(id);
  } else if (workspaceId && userId) {
    await deleteWorkspaceClientByPair(workspaceId, userId);
  } else {
    return NextResponse.json({ error: "id or (workspaceId and userId) required" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
