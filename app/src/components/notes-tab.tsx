"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder, type RecordedAudio } from "@/components/voice-recorder";
import { FileText, Mic, Trash2, StickyNote, Download } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import type { Note } from "@/lib/types";

export function NotesTab({ workspaceId }: { workspaceId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`/api/notes?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  const resetComposer = () => {
    setTitle("");
    setBody("");
    setRecording(null);
    setError("");
  };

  const saveNote = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, title: title.trim() || null, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save note");
    setNotes((prev) => [data, ...prev]);
    resetComposer();
  };

  const handleSaveText = async () => {
    if (!body.trim()) return;
    setError("");
    setSaving(true);
    try {
      await saveNote({ kind: "text", body: body.trim() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!recording) return;
    setError("");
    setSaving(true);
    try {
      const ext = recording.blob.type.includes("mp4") ? "mp4" : "webm";
      const blob = await upload(`notes/${workspaceId}/${crypto.randomUUID()}.${ext}`, recording.blob, {
        access: "public",
        handleUploadUrl: "/api/notes/upload",
        contentType: recording.blob.type || "audio/webm",
        clientPayload: JSON.stringify({ workspaceId }),
      });
      await saveNote({
        kind: "voice",
        audioUrl: blob.url,
        audioDurationSeconds: recording.durationSeconds,
        sizeBytes: recording.blob.size,
      });
    } catch (e) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
  };

  // Export all notes as a Markdown file (voice notes included as audio links).
  const exportNotes = () => {
    const body = notes
      .slice()
      .reverse()
      .map((n) => {
        const heading = `## ${n.title || (n.kind === "voice" ? "Voice note" : "Note")} — ${formatDateTime(n.createdAt)}`;
        const content = n.kind === "voice" ? `Audio: ${n.audioUrl ?? "(missing)"}` : n.body ?? "";
        return `${heading}\n\n${content}\n`;
      })
      .join("\n");
    const md = `# Notes export\n\n${body}`;
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">Notes</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={exportNotes}
          disabled={notes.length === 0}
          className="gap-1.5 rounded-xl border-neutral-300"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Composer */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("text")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              mode === "text" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> Text
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              mode === "voice" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="h-3.5 w-3.5" /> Voice
          </button>
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="h-10 rounded-xl glass border-white/[0.08]"
        />

        {mode === "text" ? (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a note…"
              rows={4}
              className="rounded-xl glass border-white/[0.08]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveText}
                disabled={saving || !body.trim()}
                className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0"
              >
                {saving ? "Saving…" : "Save note"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <VoiceRecorder recording={recording} onRecorded={setRecording} onClear={() => setRecording(null)} />
            {recording && (
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveVoice}
                  disabled={saving}
                  className="h-10 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0"
                >
                  {saving ? "Uploading…" : "Save voice note"}
                </Button>
              </div>
            )}
          </>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <StickyNote className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No notes yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Write a note or record a voice memo above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {note.kind === "voice" ? <Mic className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>{formatDateTime(note.createdAt)}</span>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {note.title && <h3 className="mt-2 text-sm font-semibold">{note.title}</h3>}
              {note.kind === "text" ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{note.body}</p>
              ) : (
                note.audioUrl && <audio controls src={note.audioUrl} className="mt-2 h-10 w-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
