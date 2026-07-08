"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Film, ImageIcon, Music2, Upload, Trash2, Download } from "lucide-react";
import { MAX_FOOTAGE_BYTES, kindFromContentType, formatBytes } from "@/lib/footage";
import type { Footage } from "@/lib/types";

interface Uploading {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

const kindIcon = { video: Film, image: ImageIcon, audio: Music2 };

export function FootageTab({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Footage[]>([]);
  const [uploads, setUploads] = useState<Uploading[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/footage?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [workspaceId]);

  const uploadOne = async (file: File) => {
    const tempId = crypto.randomUUID();
    if (!kindFromContentType(file.type)) {
      setUploads((p) => [...p, { id: tempId, name: file.name, progress: 0, error: "Unsupported type" }]);
      return;
    }
    if (file.size > MAX_FOOTAGE_BYTES) {
      setUploads((p) => [...p, { id: tempId, name: file.name, progress: 0, error: "Too large (max 500 MB)" }]);
      return;
    }
    setUploads((p) => [...p, { id: tempId, name: file.name, progress: 0 }]);
    try {
      const blob = await upload(`footage/${workspaceId}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/footage/upload",
        contentType: file.type,
        multipart: true,
        clientPayload: JSON.stringify({ workspaceId }),
        onUploadProgress: ({ percentage }) =>
          setUploads((p) => p.map((u) => (u.id === tempId ? { ...u, progress: percentage } : u))),
      });
      const res = await fetch("/api/footage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: file.name,
          url: blob.url,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || "Save failed");
      setItems((prev) => [saved, ...prev]);
      setUploads((p) => p.filter((u) => u.id !== tempId));
    } catch (e) {
      setUploads((p) => p.map((u) => (u.id === tempId ? { ...u, error: (e as Error).message } : u)));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadOne);
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/footage?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-purple-400/60 bg-purple-500/[0.06]" : "border-white/[0.1]"
        }`}
      >
        <Upload className="h-7 w-7 text-muted-foreground/50" />
        <p className="text-sm font-medium">Drop footage here, or click to browse</p>
        <p className="text-xs text-muted-foreground">Video, image, or audio · up to 500 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*,audio/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* In-progress uploads */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className="glass rounded-xl p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{u.name}</span>
                {u.error ? (
                  <span className="shrink-0 text-red-400">{u.error}</span>
                ) : (
                  <span className="shrink-0 text-muted-foreground">{Math.round(u.progress)}%</span>
                )}
              </div>
              {!u.error && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Library */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No footage yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload video, image, or audio files to build the library.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = kindIcon[item.kind];
            return (
              <div key={item.id} className="glass overflow-hidden rounded-2xl">
                <div className="relative aspect-video w-full bg-black/40">
                  {item.kind === "video" ? (
                    <video controls preload="metadata" src={item.url} className="h-full w-full object-contain" />
                  ) : item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
                      <Music2 className="h-8 w-8 text-muted-foreground/40" />
                      <audio controls src={item.url} className="w-full" />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-xs font-medium">
                      <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{item.name}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                      {formatBytes(item.sizeBytes)} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={item.name}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
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
