"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Lock } from "lucide-react";
import type { AdminNote } from "@/lib/types";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminNotesTab({ workspaceId }: { workspaceId: string }) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/admin/notes?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => setNotes(Array.isArray(d) ? d : []))
      .catch(() => {});
  };
  useEffect(load, [workspaceId]);

  const add = async () => {
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, body }),
      });
      if (res.ok) {
        setDraft("");
        const created = (await res.json()) as AdminNote;
        setNotes((prev) => [created, ...prev]);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/admin/notes?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600">
        <Lock className="h-4 w-4 text-neutral-500" />
        Private to admins. The client never sees these notes.
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Internal note about this client…"
          className="rounded-xl border-neutral-300 bg-white"
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={add}
            disabled={saving || !draft.trim()}
            className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0"
          >
            {saving ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            No admin notes yet.
          </p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="group rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{n.body}</p>
                <button
                  onClick={() => remove(n.id)}
                  className="shrink-0 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">{formatWhen(n.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
