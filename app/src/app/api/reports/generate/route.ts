import { NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/auth";
import { buildWorkspaceReport } from "@/lib/reports";
import { generateReportSummary } from "@/lib/claude";

export const maxDuration = 60;

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const user = await requireWorkspaceAccess(body.workspaceId);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const from = isDate(body.from) ? body.from : null;
  const to = isDate(body.to) ? body.to : null;

  const report = await buildWorkspaceReport(body.workspaceId, from, to);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The report is useful even if the AI summary fails (e.g. no API credits);
  // don't block on it — return the reason so the UI can note it (admin-only).
  let summary = "";
  let summaryError = "";
  try {
    summary = await generateReportSummary(report);
  } catch (err) {
    const msg = (err as Error).message.toLowerCase();
    summaryError =
      msg.includes("credit") || msg.includes("billing")
        ? "AI summary unavailable — the Anthropic API account is out of credits."
        : msg.includes("429") || msg.includes("rate")
          ? "AI summary unavailable — Anthropic API rate limit reached."
          : "AI summary unavailable right now.";
  }

  return NextResponse.json({ report, summary, summaryError });
}
