import { NextResponse, after } from "next/server";
import { del } from "@vercel/blob";
import { requireWorkspaceAccess } from "@/lib/auth";
import { listAnalyses, createAnalysis, getAnalysisById, deleteAnalysis } from "@/lib/db";
import { runAnalysis } from "@/lib/analysis-runner";

// Gemini file processing + analysis + Claude can run a few minutes; the work
// happens in after() within this invocation, so give it headroom.
export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listAnalyses(workspaceId));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId || !body.videoUrl || !body.videoName || !body.analysisPrompt?.trim()) {
    return NextResponse.json(
      { error: "workspaceId, videoUrl, videoName and analysisPrompt required" },
      { status: 400 }
    );
  }

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const record = await createAnalysis({
    workspaceId: body.workspaceId,
    videoUrl: body.videoUrl,
    videoName: String(body.videoName).slice(0, 500),
    analysisPrompt: body.analysisPrompt,
    brandContext: body.brandContext?.trim() || null,
    createdBy: user.id,
  });

  // Process in the background; the client polls GET for status.
  after(() => runAnalysis(record.id));

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const record = await getAnalysisById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await requireWorkspaceAccess(record.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only delete the blob if it's one we own (uploaded videos live in our store;
  // videos picked from Footage are shared and deleted with their Footage item).
  if (record.videoUrl.includes(".blob.vercel-storage.com") && record.videoUrl.includes("/analysis/")) {
    try {
      await del(record.videoUrl);
    } catch {
      // ignore
    }
  }

  await deleteAnalysis(id);
  return NextResponse.json({ success: true });
}
