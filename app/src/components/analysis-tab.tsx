"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/markdown-content";
import { DEFAULT_ANALYSIS_PROMPT, ANALYSIS_MAX_BYTES } from "@/lib/analysis";
import {
  Upload,
  Film,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { parseDbTimestamp, formatDateTime } from "@/lib/dates";
import type { Analysis, Footage } from "@/lib/types";

const STALE_MS = 7 * 60 * 1000; // treat a processing record older than this as timed-out

export function AnalysisTab({ workspaceId }: { workspaceId: string }) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"upload" | "footage">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [footageVideos, setFootageVideos] = useState<Footage[]>([]);
  const [selectedFootage, setSelectedFootage] = useState("");
  const [prompt, setPrompt] = useState(DEFAULT_ANALYSIS_PROMPT);
  const [showPrompt, setShowPrompt] = useState(false);
  const [brandContext, setBrandContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch(`/api/analysis?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setAnalyses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  useEffect(() => {
    fetch(`/api/footage?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data: Footage[]) => setFootageVideos((Array.isArray(data) ? data : []).filter((f) => f.kind === "video")));
  }, [workspaceId]);

  // Poll while anything is still processing.
  useEffect(() => {
    if (!analyses.some((a) => a.status === "processing")) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyses]);

  const isStale = (a: Analysis) =>
    a.status === "processing" && Date.now() - parseDbTimestamp(a.createdAt).getTime() > STALE_MS;

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      let videoUrl: string;
      let videoName: string;

      if (source === "upload") {
        if (!file) {
          setError("Choose a video to upload.");
          return;
        }
        if (file.size > ANALYSIS_MAX_BYTES) {
          setError("That video is over the 500 MB limit.");
          return;
        }
        setUploadPct(0);
        const blob = await upload(`analysis/${workspaceId}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/analysis/upload",
          contentType: file.type,
          multipart: true,
          clientPayload: JSON.stringify({ workspaceId }),
          onUploadProgress: ({ percentage }) => setUploadPct(percentage),
        });
        videoUrl = blob.url;
        videoName = file.name;
      } else {
        const f = footageVideos.find((v) => v.id === selectedFootage);
        if (!f) {
          setError("Pick a video from your Footage library.");
          return;
        }
        videoUrl = f.url;
        videoName = f.name;
      }

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, videoUrl, videoName, analysisPrompt: prompt, brandContext }),
      });
      const rec = await res.json();
      if (!res.ok) throw new Error(rec.error || "Failed to start analysis");
      setAnalyses((prev) => [rec, ...prev]);
      setFile(null);
      setSelectedFootage("");
      setBrandContext("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
      setUploadPct(null);
    }
  };

  const retry = async (id: string) => {
    setAnalyses((prev) => prev.map((a) => (a.id === id ? { ...a, status: "processing", error: null } : a)));
    await fetch(`/api/analysis/process?id=${id}`, { method: "POST" });
    load();
  };

  const remove = async (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/analysis?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="glass space-y-4 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neutral-600" />
          <h2 className="text-sm font-semibold">Analyze a video</h2>
        </div>

        {/* Source toggle */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setSource("upload")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              source === "upload" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <button
            onClick={() => setSource("footage")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              source === "footage" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="h-3.5 w-3.5" /> From Footage
          </button>
        </div>

        {source === "upload" ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="glass flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] p-6 text-center text-sm"
          >
            <Upload className="h-4 w-4 text-muted-foreground/60" />
            <span className={file ? "" : "text-muted-foreground"}>
              {file ? file.name : "Click to choose a video (up to 500 MB)"}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <select
            value={selectedFootage}
            onChange={(e) => setSelectedFootage(e.target.value)}
            className="glass h-11 w-full rounded-xl border border-white/[0.08] bg-transparent px-3 text-sm"
          >
            <option value="">
              {footageVideos.length ? "Select a footage video…" : "No videos in Footage yet"}
            </option>
            {footageVideos.map((f) => (
              <option key={f.id} value={f.id} className="bg-neutral-900">
                {f.name}
              </option>
            ))}
          </select>
        )}

        {uploadPct !== null && (
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full bg-neutral-900 transition-all"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Brand / context (optional)</label>
          <Textarea
            value={brandContext}
            onChange={(e) => setBrandContext(e.target.value)}
            placeholder="Your niche, audience, goals — the content ideas will be tailored to this."
            rows={2}
            className="mt-1.5 rounded-xl glass border-white/[0.08]"
          />
        </div>

        {/* Editable analysis prompt (collapsed by default) */}
        <div>
          <button
            onClick={() => setShowPrompt((s) => !s)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPrompt ? "rotate-180" : ""}`} />
            Customize analysis prompt
          </button>
          {showPrompt && (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="mt-2 rounded-xl glass border-white/[0.08] font-mono text-xs leading-relaxed"
            />
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end">
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-10 gap-1.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {submitting ? (uploadPct !== null ? `Uploading ${Math.round(uploadPct)}%` : "Starting…") : "Analyze video"}
          </Button>
        </div>
      </div>

      {/* History */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : analyses.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No analyses yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload a video above to get an AI breakdown and content ideas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((a) => {
            const failed = a.status === "failed" || isStale(a);
            const open = expanded[a.id];
            return (
              <div key={a.id} className="glass overflow-hidden rounded-2xl">
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  <video
                    controls
                    preload="metadata"
                    src={a.videoUrl}
                    className="aspect-video w-full shrink-0 rounded-xl bg-black/40 object-contain sm:w-56"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.videoName}</p>
                        <p className="text-[11px] text-muted-foreground/60">
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(a.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {a.status === "processing" && !isStale(a) && (
                      <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing… this can take a couple of minutes.
                      </p>
                    )}

                    {failed && (
                      <div className="mt-3 space-y-2">
                        <p className="inline-flex items-center gap-2 text-sm text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          {isStale(a) ? "This took longer than expected." : a.error || "Analysis failed."}
                        </p>
                        <Button
                          onClick={() => retry(a.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg border-white/[0.08]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retry
                        </Button>
                      </div>
                    )}

                    {a.status === "completed" && (
                      <button
                        onClick={() => setExpanded((p) => ({ ...p, [a.id]: !open }))}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                        {open ? "Hide results" : "View analysis & content ideas"}
                      </button>
                    )}
                  </div>
                </div>

                {a.status === "completed" && open && (
                  <div className="grid gap-5 border-t border-white/[0.06] p-5 lg:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
                        Video analysis
                      </h4>
                      <MarkdownContent content={a.analysisText || ""} variant="analysis" />
                    </div>
                    <div>
                      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
                        Content ideas
                      </h4>
                      <MarkdownContent content={a.ideasText || ""} variant="concepts" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
