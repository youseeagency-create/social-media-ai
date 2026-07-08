import {
  getWorkspaceById,
  listInspiration,
  listNotes,
  listFootage,
  listAnalyses,
  listCalendarItems,
} from "./db";

export interface ReportData {
  workspaceName: string;
  from: string | null;
  to: string | null;
  generatedAt: string;
  inspiration: { total: number; byPlatform: Record<string, number> };
  notes: { total: number; text: number; voice: number };
  footage: { total: number; byKind: Record<string, number>; totalBytes: number };
  analyses: { total: number; completed: number; titles: string[] };
  calendar: {
    total: number;
    byStatus: Record<string, number>;
    upcoming: { title: string; date: string; status: string }[];
  };
}

// Inclusive [from, to] on YYYY-MM-DD strings (lexicographic works for ISO dates).
function inRange(dateStr: string, from: string | null, to: string | null): boolean {
  const d = dateStr.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// Aggregates a workspace's stored data into a report snapshot. All source data
// is workspace-scoped; callers must authorize the workspace first.
export async function buildWorkspaceReport(
  workspaceId: string,
  from: string | null,
  to: string | null
): Promise<ReportData | null> {
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) return null;

  const [inspiration, notes, footage, analyses, calendar] = await Promise.all([
    listInspiration(workspaceId),
    listNotes(workspaceId),
    listFootage(workspaceId),
    listAnalyses(workspaceId),
    listCalendarItems(workspaceId),
  ]);

  const insp = inspiration.filter((i) => inRange(i.createdAt, from, to));
  const nts = notes.filter((n) => inRange(n.createdAt, from, to));
  const ftg = footage.filter((f) => inRange(f.createdAt, from, to));
  const anl = analyses.filter((a) => inRange(a.createdAt, from, to));
  const cal = calendar.filter((c) => inRange(c.scheduledDate, from, to));

  const countBy = <T, K extends string>(arr: T[], key: (t: T) => K): Record<string, number> =>
    arr.reduce<Record<string, number>>((acc, t) => {
      const k = key(t);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  const today = new Date().toISOString().slice(0, 10);

  return {
    workspaceName: workspace.name,
    from,
    to,
    generatedAt: new Date().toISOString(),
    inspiration: { total: insp.length, byPlatform: countBy(insp, (i) => i.platform) },
    notes: {
      total: nts.length,
      text: nts.filter((n) => n.kind === "text").length,
      voice: nts.filter((n) => n.kind === "voice").length,
    },
    footage: {
      total: ftg.length,
      byKind: countBy(ftg, (f) => f.kind),
      totalBytes: ftg.reduce((s, f) => s + (f.sizeBytes || 0), 0),
    },
    analyses: {
      total: anl.length,
      completed: anl.filter((a) => a.status === "completed").length,
      titles: anl.filter((a) => a.status === "completed").map((a) => a.videoName),
    },
    calendar: {
      total: cal.length,
      byStatus: countBy(cal, (c) => c.status),
      upcoming: cal
        .filter((c) => c.scheduledDate >= today && c.status !== "posted")
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
        .slice(0, 8)
        .map((c) => ({ title: c.title, date: c.scheduledDate, status: c.status })),
    },
  };
}
