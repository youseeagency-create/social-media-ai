import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import {
  listCalendarItems,
  createCalendarItem,
  getCalendarItemById,
  updateCalendarItem,
  deleteCalendarItem,
} from "@/lib/db";

const STATUSES = ["planned", "filming", "posted"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (s: unknown): s is Status => STATUSES.includes(s as Status);
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listCalendarItems(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.title?.trim() || !isDate(body.scheduledDate)) {
    return NextResponse.json({ error: "workspaceId, title and scheduledDate required" }, { status: 400 });
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const item = await createCalendarItem({
    workspaceId: body.workspaceId,
    title: String(body.title).trim().slice(0, 300),
    description: body.description?.trim() || null,
    scheduledDate: body.scheduledDate,
    status: isStatus(body.status) ? body.status : "planned",
    createdBy: user.id,
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getCalendarItemById(body.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(existing.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.scheduledDate !== undefined && !isDate(body.scheduledDate)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (body.status !== undefined && !isStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await updateCalendarItem(body.id, {
    ...(body.title !== undefined ? { title: String(body.title).trim().slice(0, 300) } : {}),
    ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    ...(body.scheduledDate !== undefined ? { scheduledDate: body.scheduledDate } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
  });
  // Row may have been deleted between the existence check and the update.
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await getCalendarItemById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(existing.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteCalendarItem(id);
  return NextResponse.json({ success: true });
}
