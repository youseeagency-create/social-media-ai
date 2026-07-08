"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { CalendarItem } from "@/lib/types";

const STATUSES = ["planned", "filming", "posted"] as const;
type Status = (typeof STATUSES)[number];

const statusMeta: Record<Status, { label: string; chip: string; dot: string }> = {
  planned: { label: "Planned", chip: "bg-sky-500/15 text-sky-300 border-sky-500/25", dot: "bg-sky-400" },
  filming: { label: "Filming", chip: "bg-amber-500/15 text-amber-300 border-amber-500/25", dot: "bg-amber-400" },
  posted: { label: "Posted", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Editing =
  | { mode: "new"; scheduledDate: string }
  | { mode: "edit"; item: CalendarItem }
  | null;

export function CalendarTab({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [editing, setEditing] = useState<Editing>(null);
  const [form, setForm] = useState({ title: "", description: "", scheduledDate: "", status: "planned" as Status });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    fetch(`/api/calendar?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []));
  };
  useEffect(load, [workspaceId]);

  const openNew = (dateStr: string) => {
    setSaveError("");
    setForm({ title: "", description: "", scheduledDate: dateStr, status: "planned" });
    setEditing({ mode: "new", scheduledDate: dateStr });
  };
  const openEdit = (item: CalendarItem) => {
    setSaveError("");
    setForm({
      title: item.title,
      description: item.description ?? "",
      scheduledDate: item.scheduledDate,
      status: item.status,
    });
    setEditing({ mode: "edit", item });
  };

  const save = async () => {
    if (!form.title.trim() || !form.scheduledDate) return;
    setSaving(true);
    setSaveError("");
    try {
      if (editing?.mode === "edit") {
        const res = await fetch("/api/calendar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.item.id, ...form }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error || "Couldn't save changes.");
          return;
        }
        setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
      } else {
        const res = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, ...form }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error || "Couldn't add item.");
          return;
        }
        setItems((prev) => [...prev, data]);
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (editing?.mode !== "edit") return;
    const id = editing.item.id;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEditing(null);
    await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
  };

  // Build the month grid.
  const first = new Date(cursor.year, cursor.month, 1);
  const startBlanks = first.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(ymd(new Date(cursor.year, cursor.month, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = ymd(new Date());
  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const itemsByDate = items.reduce<Record<string, CalendarItem[]>>((acc, it) => {
    (acc[it.scheduledDate] ??= []).push(it);
    return acc;
  }, {});

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => shiftMonth(-1)} className="h-8 w-8 p-0 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-sm font-semibold">{monthLabel}</h2>
          <Button variant="ghost" size="sm" onClick={() => shiftMonth(1)} className="h-8 w-8 p-0 rounded-lg">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const n = new Date();
              setCursor({ year: n.getFullYear(), month: n.getMonth() });
            }}
            className="h-8 rounded-lg border-white/[0.08] text-xs"
          >
            Today
          </Button>
        </div>
        <Button
          onClick={() => openNew(todayStr)}
          className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
        >
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7 border-b border-white/[0.06] text-center text-[11px] font-medium text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((dateStr, i) => (
            <div
              key={i}
              onClick={() => dateStr && openNew(dateStr)}
              className={`min-h-[92px] border-b border-r border-white/[0.04] p-1.5 ${
                dateStr ? "cursor-pointer hover:bg-white/[0.02]" : "bg-black/10"
              } ${i % 7 === 6 ? "border-r-0" : ""}`}
            >
              {dateStr && (
                <>
                  <div
                    className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      dateStr === todayStr ? "bg-purple-500 text-white" : "text-muted-foreground"
                    }`}
                  >
                    {Number(dateStr.slice(-2))}
                  </div>
                  <div className="space-y-1">
                    {(itemsByDate[dateStr] ?? []).map((it) => (
                      <button
                        key={it.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(it);
                        }}
                        className={`flex w-full items-center gap-1 truncate rounded-md border px-1 py-0.5 text-left text-[10px] ${statusMeta[it.status].chip}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusMeta[it.status].dot}`} />
                        <span className="truncate">{it.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[11px] text-muted-foreground">
        {STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusMeta[s].dot}`} />
            {statusMeta[s].label}
          </span>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md glass-strong rounded-2xl border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>{editing?.mode === "edit" ? "Edit item" : "New item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Film the hook-tips reel"
                className="mt-1.5 h-11 rounded-xl glass border-white/[0.08]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1.5 rounded-xl glass border-white/[0.08]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="mt-1.5 h-11 rounded-xl glass border-white/[0.08]"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="mt-1.5 h-11 w-full rounded-xl glass border border-white/[0.08] bg-transparent px-3 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-neutral-900">
                      {statusMeta[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              {editing?.mode === "edit" ? (
                <Button variant="ghost" size="sm" onClick={remove} className="gap-1.5 text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              ) : (
                <span />
              )}
              <Button
                onClick={save}
                disabled={saving || !form.title.trim() || !form.scheduledDate}
                className="h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
              >
                {saving ? "Saving…" : editing?.mode === "edit" ? "Save changes" : "Add item"}
              </Button>
            </div>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
