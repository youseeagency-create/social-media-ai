import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { listMessages, createMessage } from "@/lib/db";

// Per-workspace chat. Not under the admin-only /api prefix and not in the
// proxy matcher — authorized per request with requireWorkspaceAccess (admin
// bypass, else the client must be assigned to the workspace), so both the admin
// and assigned clients read/write the same shared thread.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listMessages(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.body?.trim()) {
    return NextResponse.json({ error: "workspaceId and body required" }, { status: 400 });
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await createMessage({
    workspaceId: body.workspaceId,
    senderId: user.id,
    body: String(body.body).trim().slice(0, 4000),
  });
  return NextResponse.json(message, { status: 201 });
}
