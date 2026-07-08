"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Printer, Loader2, Sparkles } from "lucide-react";
import { formatBytes } from "@/lib/footage";
import { formatDate } from "@/lib/dates";
import type { ReportData } from "@/lib/reports";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-neutral-200 pt-4">
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">{title}</h3>
      {children}
    </div>
  );
}

const pairs = (obj: Record<string, number>) =>
  Object.entries(obj)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}`)
    .join(" · ") || "—";

export function ReportsTab({ workspaceId }: { workspaceId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, from: from || undefined, to: to || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data.report);
      setSummary(data.summary || "");
      setSummaryError(data.summaryError || "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const periodLabel =
    report?.from || report?.to
      ? `${report?.from || "start"} – ${report?.to || "today"}`
      : "All time";

  return (
    <div className="space-y-5">
      {/* Controls (not printed) */}
      <div className="no-print glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">From (optional)</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5 h-11 rounded-xl glass border-white/[0.08]"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">To (optional)</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 h-11 rounded-xl glass border-white/[0.08]"
          />
        </div>
        <Button
          onClick={generate}
          disabled={loading}
          className="h-11 gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate report"}
        </Button>
        {report && (
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="h-11 gap-1.5 rounded-xl border-white/[0.08]"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        )}
      </div>
      {error && <p className="no-print text-sm text-red-400">{error}</p>}
      {report && summaryError && (
        <p className="no-print text-xs text-amber-400/80">{summaryError} The report below is still complete.</p>
      )}

      {!report && !loading && (
        <div className="no-print glass rounded-2xl p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Generate a client report</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pull this workspace&apos;s inspiration, notes, footage, analyses, and calendar into a shareable summary.
          </p>
        </div>
      )}

      {/* The report document (printed) */}
      {report && (
        <div id="report" className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-neutral-800 shadow-sm">
          <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{report.workspaceName}</h1>
              <p className="text-sm text-neutral-500">Content Report</p>
            </div>
            <div className="text-right text-xs text-neutral-500">
              <p>{periodLabel}</p>
              <p>Generated {formatDate(report.generatedAt)}</p>
            </div>
          </div>

          {summary && (
            <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4">
              <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-purple-700">
                <Sparkles className="h-3 w-3" /> Summary
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{summary}</p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Inspiration" value={report.inspiration.total} />
            <Stat label="Notes" value={report.notes.total} />
            <Stat label="Footage" value={report.footage.total} />
            <Stat label="Analyses" value={report.analyses.completed} />
            <Stat label="Calendar" value={report.calendar.total} />
          </div>

          <div className="mt-6 space-y-4">
            <Section title="Inspiration saved">
              <p className="text-sm text-neutral-600">{pairs(report.inspiration.byPlatform)}</p>
            </Section>

            <Section title="Notes">
              <p className="text-sm text-neutral-600">
                {report.notes.text} text · {report.notes.voice} voice
              </p>
            </Section>

            <Section title="Footage uploaded">
              <p className="text-sm text-neutral-600">
                {pairs(report.footage.byKind)}
                {report.footage.total > 0 && ` · ${formatBytes(report.footage.totalBytes)} total`}
              </p>
            </Section>

            <Section title="Videos analyzed">
              {report.analyses.titles.length ? (
                <ul className="list-inside list-disc text-sm text-neutral-600">
                  {report.analyses.titles.map((t, i) => (
                    <li key={i} className="truncate">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-600">—</p>
              )}
            </Section>

            <Section title="Content calendar">
              <p className="text-sm text-neutral-600">{pairs(report.calendar.byStatus)}</p>
              {report.calendar.upcoming.length > 0 && (
                <>
                  <p className="mt-3 mb-1 text-xs font-medium text-neutral-500">Upcoming</p>
                  <ul className="space-y-1 text-sm text-neutral-700">
                    {report.calendar.upcoming.map((u, i) => (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <span className="truncate">{u.title}</span>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {u.date} · {u.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
