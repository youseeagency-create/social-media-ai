import { NextResponse } from "next/server";
import { getCurrentUser, requireWorkspaceAccess } from "@/lib/auth";
import { listActivity } from "@/lib/db";

// GET ?workspaceId= → activity for that workspace (admin or assigned client).
// GET with no workspaceId → all workspaces (admin only).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  if (workspaceId) {
    const user = await requireWorkspaceAccess(workspaceId);
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(await listActivity({ workspaceId, limit }));
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await listActivity({ limit }));
}
