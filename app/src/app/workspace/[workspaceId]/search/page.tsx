import Link from "next/link";
import { searchWorkspace } from "@/lib/db";

function Section({
  title,
  href,
  children,
  count,
}: {
  title: string;
  href: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">
          {title} <span className="text-neutral-400">({count})</span>
        </h2>
        <Link href={href} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
          Open tab →
        </Link>
      </div>
      <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">{children}</div>
    </div>
  );
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { workspaceId } = await params;
  const { q = "" } = await searchParams;
  const results = await searchWorkspace(workspaceId, q);
  const total =
    results.inspiration.length +
    results.notes.length +
    results.footage.length +
    results.calendar.length +
    results.chat.length;
  const base = `/workspace/${workspaceId}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {q ? (
            <>
              {total} result{total === 1 ? "" : "s"} for “{q}”
            </>
          ) : (
            "Type a query in the search box above."
          )}
        </p>
      </div>

      {q && total === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
          No matches across inspiration, notes, footage, calendar, or chat.
        </div>
      )}

      <Section title="Inspiration" href={`${base}/inspiration`} count={results.inspiration.length}>
        {results.inspiration.map((i) => (
          <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="block px-4 py-2.5 text-sm hover:bg-neutral-50">
            <span className="font-medium capitalize">{i.platform}</span>{" "}
            <span className="text-neutral-500">{i.url}</span>
          </a>
        ))}
      </Section>

      <Section title="Notes" href={`${base}/notes`} count={results.notes.length}>
        {results.notes.map((n) => (
          <div key={n.id} className="px-4 py-2.5 text-sm">
            {n.title && <span className="font-medium">{n.title} </span>}
            <span className="text-neutral-600">{n.body ? (n.body.length > 120 ? `${n.body.slice(0, 120)}…` : n.body) : n.kind === "voice" ? "Voice note" : ""}</span>
          </div>
        ))}
      </Section>

      <Section title="Footage" href={`${base}/footage`} count={results.footage.length}>
        {results.footage.map((f) => (
          <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="font-medium">{f.name}</span>
            <span className="text-xs uppercase text-neutral-400">{f.kind}</span>
          </div>
        ))}
      </Section>

      <Section title="Calendar" href={`${base}/calendar`} count={results.calendar.length}>
        {results.calendar.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="truncate font-medium">{c.title}</span>
            <span className="shrink-0 text-xs text-neutral-500">{c.scheduledDate}</span>
          </div>
        ))}
      </Section>

      <Section title="Chat" href={`${base}/chat`} count={results.chat.length}>
        {results.chat.map((m) => (
          <div key={m.id} className="px-4 py-2.5 text-sm">
            <span className="font-medium">{m.senderName ?? "Unknown"}: </span>
            <span className="text-neutral-600">{m.body.length > 120 ? `${m.body.slice(0, 120)}…` : m.body}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
