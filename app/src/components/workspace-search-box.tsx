"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function WorkspaceSearchBox({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/workspace/${workspaceId}/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <form onSubmit={submit} className="relative hidden sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search this workspace…"
        className="h-9 w-56 rounded-full border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-neutral-900"
      />
    </form>
  );
}
