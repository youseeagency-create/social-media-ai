import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { searchWorkspace } from "@/lib/db";

// GET ?workspaceId=&q= → matches across inspiration, notes, footage, calendar, chat.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const q = searchParams.get("q") ?? "";
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await searchWorkspace(workspaceId, q));
}
