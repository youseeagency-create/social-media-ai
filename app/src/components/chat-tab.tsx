"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ChatTab({
  workspaceId,
  currentUserId,
}: {
  workspaceId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch(`/api/messages?workspaceId=${workspaceId}`)
        .then((r) => r.json())
        .then((data) => {
          if (active) setMessages(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    };
    load();
    // Polling stands in for realtime — new messages from the other side appear
    // within a few seconds; also refresh when the tab regains focus.
    const interval = setInterval(load, 4000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [workspaceId]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, body }),
      });
      if (res.ok) {
        setDraft("");
        const created = (await res.json()) as ChatMessage;
        // Append immediately for snappy feedback; the poll reconciles sender info.
        setMessages((prev) => [...prev, created]);
      }
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-neutral-900">No messages yet</p>
              <p className="mt-1 text-sm text-neutral-500">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-neutral-500">
                  <span className="font-medium text-neutral-700">
                    {mine ? "You" : m.senderName ?? "Unknown"}
                  </span>
                  {m.senderRole === "admin" && (
                    <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                      Admin
                    </span>
                  )}
                  <span>{formatTime(m.createdAt)}</span>
                </div>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    mine
                      ? "rounded-br-sm bg-neutral-900 text-white"
                      : "rounded-bl-sm bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border-neutral-300 bg-white"
          />
          <Button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="h-11 gap-1.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 border-0"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
