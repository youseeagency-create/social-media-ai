import { NextResponse } from "next/server";
import { getCurrentUser, requireWorkspaceAccess } from "@/lib/auth";
import {
  getWorkspaceUnseen,
  getUnseenWorkspaceIds,
  markSeen,
  getWorkspaces,
  listWorkspacesForUser,
} from "@/lib/db";

// GET ?workspaceId= → per-section unseen counts for that workspace.
// GET with no workspaceId → { [workspaceId]: true } for workspaces with any
//   unseen activity (aggregate dot in the picker / dashboard).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (workspaceId) {
    const user = await requireWorkspaceAccess(workspaceId);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(await getWorkspaceUnseen(user.id, workspaceId));
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ids =
    user.role === "admin"
      ? (await getWorkspaces()).filter((w) => !w.archivedAt).map((w) => w.id)
      : (await listWorkspacesForUser(user.id)).map((w) => w.id);
  const unseen = await getUnseenWorkspaceIds(user.id, ids);
  return NextResponse.json(Object.fromEntries(unseen.map((id) => [id, true])));
}

// POST { workspaceId, section } → mark that section seen "now".
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.section) {
    return NextResponse.json({ error: "workspaceId and section required" }, { status: 400 });
  }
  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await markSeen(user.id, body.workspaceId, String(body.section));
  return NextResponse.json({ success: true });
}
