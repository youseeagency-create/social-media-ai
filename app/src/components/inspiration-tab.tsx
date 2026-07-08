"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Instagram,
  Youtube,
  Music2,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { InspirationItem } from "@/lib/types";

const platformMeta: Record<
  InspirationItem["platform"],
  { label: string; icon: typeof LinkIcon; chip: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, chip: "bg-pink-500/15 text-pink-300 border-pink-500/20" },
  tiktok: { label: "TikTok", icon: Music2, chip: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20" },
  youtube: { label: "YouTube", icon: Youtube, chip: "bg-red-500/15 text-red-300 border-red-500/20" },
  other: { label: "Link", icon: LinkIcon, chip: "bg-white/[0.06] text-muted-foreground border-white/[0.08]" },
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function InspirationTab({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inflight = useRef<Set<string>>(new Set());

  // Scrapes + persists an Instagram/TikTok thumbnail, then patches the card.
  const fetchThumbnail = async (id: string) => {
    if (inflight.current.has(id)) return;
    inflight.current.add(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, thumbnailStatus: "pending" } : i)));
    try {
      const res = await fetch(`/api/inspiration/thumbnail?id=${id}`, { method: "POST" });
      if (res.ok) {
        const updated = (await res.json()) as InspirationItem;
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    } finally {
      inflight.current.delete(id);
    }
  };

  const load = () => {
    setLoading(true);
    fetch(`/api/inspiration?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        const list: InspirationItem[] = Array.isArray(data) ? data : [];
        setItems(list);
        list.filter((i) => i.thumbnailStatus === "pending").forEach((i) => fetchThumbnail(i.id));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/inspiration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add");
        return;
      }
      setUrl("");
      setItems((prev) => [data, ...prev]);
      if (data.thumbnailStatus === "pending") fetchThumbnail(data.id);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/inspiration?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste an Instagram, TikTok, or YouTube link…"
          className="h-11 flex-1 rounded-xl glass border-white/[0.08]"
        />
        <Button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No inspiration yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Paste a link above to start saving references.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const meta = platformMeta[item.platform];
            const Icon = meta.icon;
            return (
              <div key={item.id} className="glass group overflow-hidden rounded-2xl">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative aspect-video w-full bg-black/30">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                      />
                    ) : item.thumbnailStatus === "pending" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground/50">Loading preview…</span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </a>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${meta.chip}`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">{hostOf(item.url)}</p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {item.thumbnailStatus === "failed" && (
                      <button
                        onClick={() => fetchThumbnail(item.id)}
                        title="Retry preview"
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
