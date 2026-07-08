import Link from "next/link";
import { Lightbulb, StickyNote, Film, Sparkles, Calendar, MessageSquare, FileText } from "lucide-react";
import { listActivity, listCalendarItems, listMessages, getWorkspaceById } from "@/lib/db";
import { ActivityList } from "@/components/activity-list";

const QUICK_LINKS = [
  { slug: "inspiration", label: "Inspiration", icon: Lightbulb },
  { slug: "notes", label: "Notes", icon: StickyNote },
  { slug: "footage", label: "Footage", icon: Film },
  { slug: "analysis", label: "Analysis", icon: Sparkles },
  { slug: "calendar", label: "Content Calendar", icon: Calendar },
  { slug: "chat", label: "Chat", icon: MessageSquare },
  { slug: "reports", label: "Reports", icon: FileText },
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const [workspace, activity, calendar, messages] = await Promise.all([
    getWorkspaceById(workspaceId),
    listActivity({ workspaceId, limit: 8 }),
    listCalendarItems(workspaceId),
    listMessages(workspaceId),
  ]);

  const today = ymd(new Date());
  const upcoming = calendar
    .filter((c) => c.scheduledDate >= today && c.status !== "posted")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);
  const latestChat = messages.slice(-4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{workspace?.name ?? "Workspace"}</h1>
        <p className="mt-1 text-sm text-neutral-500">Here’s what’s happening in your workspace.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.slug}
            href={`/workspace/${workspaceId}/${l.slug}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-neutral-900"
          >
            <l.icon className="h-5 w-5 text-neutral-700" />
            <span className="text-xs font-medium">{l.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-500">Recent activity</h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-2">
            <ActivityList entries={activity} empty="No activity yet in this workspace." />
          </div>
        </div>

        {/* Upcoming + latest chat */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-500">Upcoming</h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-2">
              {upcoming.length === 0 ? (
                <p className="p-4 text-sm text-neutral-500">Nothing scheduled.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {upcoming.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="truncate text-sm font-medium">{c.title}</span>
                      <span className="shrink-0 text-xs text-neutral-500">{formatDate(c.scheduledDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-neutral-500">
              Latest chat
              <Link href={`/workspace/${workspaceId}/chat`} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
                Open →
              </Link>
            </h2>
            <div className="rounded-2xl border border-neutral-200 bg-white p-2">
              {latestChat.length === 0 ? (
                <p className="p-4 text-sm text-neutral-500">No messages yet.</p>
              ) : (
                <ul className="space-y-2 p-2">
                  {latestChat.map((m) => (
                    <li key={m.id} className="text-sm">
                      <span className="font-medium text-neutral-900">{m.senderName ?? "Unknown"}: </span>
                      <span className="text-neutral-600">{m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
