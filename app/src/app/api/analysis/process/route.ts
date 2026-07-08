import { NextResponse, after } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { getAnalysisById, updateAnalysis } from "@/lib/db";
import { runAnalysis } from "@/lib/analysis-runner";

export const maxDuration = 300;

// Re-runs analysis for a record (used to retry a failed or timed-out one).
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await getAnalysisById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(record.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await updateAnalysis(id, { status: "processing", error: null });
  after(() => runAnalysis(id));

  return NextResponse.json({ ...record, status: "processing", error: null });
}
