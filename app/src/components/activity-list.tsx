import type { ActivityEntry, ActivityType } from "@/lib/db";

const VERB: Record<ActivityType, (detail: string) => string> = {
  inspiration: (d) => `added ${d}`,
  note: (d) => `added ${d}`,
  footage: (d) => `uploaded footage “${d}”`,
  analysis: (d) => `ran an analysis on “${d}”`,
  calendar: (d) => `scheduled “${d}”`,
  message: (d) => `sent: “${d}”`,
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ActivityList({
  entries,
  showWorkspace = false,
  empty = "No activity yet.",
}: {
  entries: ActivityEntry[];
  showWorkspace?: boolean;
  empty?: string;
}) {
  if (entries.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-neutral-100">
      {entries.map((a, i) => (
        <li key={i} className="px-3 py-2.5">
          <p className="text-sm text-neutral-800">
            <span className="font-medium text-neutral-900">{a.actorName ?? "Someone"}</span>
            {a.actorRole === "admin" && <span className="text-neutral-400"> (admin)</span>}{" "}
            <span className="text-neutral-600">{VERB[a.type](a.detail)}</span>
            {showWorkspace && (
              <>
                {" "}
                <span className="text-neutral-400">in</span>{" "}
                <span className="font-medium text-neutral-900">{a.workspaceName}</span>
              </>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">{formatWhen(a.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
