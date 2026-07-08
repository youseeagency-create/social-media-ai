"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2 } from "lucide-react";

export interface RecordedAudio {
  blob: Blob;
  url: string;
  durationSeconds: number;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  recording,
  onRecorded,
  onClear,
}: {
  recording: RecordedAudio | null;
  onRecorded: (audio: RecordedAudio) => void;
  onClear: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        onRecorded({ blob, url: URL.createObjectURL(blob), durationSeconds });
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch {
      setError("Microphone access was denied.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    stopTimer();
    setIsRecording(false);
  };

  if (recording) {
    return (
      <div className="flex items-center gap-3">
        <audio controls src={recording.url} className="h-9 flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
          Discard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isRecording ? (
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono text-sm tabular-nums">{fmt(elapsed)}</span>
          <Button type="button" onClick={stop} className="ml-auto h-9 gap-1.5 rounded-xl bg-red-500/90 hover:bg-red-500 border-0">
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={start} className="h-11 w-full gap-1.5 rounded-xl glass border-white/[0.08]" variant="outline">
          <Mic className="h-4 w-4" />
          Start recording
        </Button>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
