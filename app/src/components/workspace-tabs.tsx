"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// section maps a tab to its notification bucket (null = not tracked).
const TABS: { slug: string; label: string; section: string | null; adminOnly?: boolean }[] = [
  { slug: "home", label: "Home", section: null },
  { slug: "inspiration", label: "Inspiration", section: "inspiration" },
  { slug: "notes", label: "Notes", section: "notes" },
  { slug: "footage", label: "Footage", section: "footage" },
  { slug: "analysis", label: "Analysis", section: null },
  { slug: "calendar", label: "Content Calendar", section: "calendar" },
  { slug: "chat", label: "Chat", section: "chat" },
  { slug: "reports", label: "Reports", section: null },
  { slug: "admin-notes", label: "Admin Notes", section: null, adminOnly: true },
];

export function WorkspaceTabs({ workspaceId, isAdmin }: { workspaceId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const active = tabs.find((t) => pathname.endsWith(`/${t.slug}`))?.slug ?? "home";
  const [unseen, setUnseen] = useState<Record<string, number>>({});

  const activeSection = tabs.find((t) => t.slug === active)?.section ?? null;

  useEffect(() => {
    let alive = true;
    const loadCounts = () =>
      fetch(`/api/notifications?workspaceId=${workspaceId}`)
        .then((r) => r.json())
        .then((d) => alive && setUnseen(d && typeof d === "object" ? d : {}))
        .catch(() => {});

    // Opening a section marks it seen, then we refresh the badges.
    const run = async () => {
      if (activeSection) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, section: activeSection }),
        }).catch(() => {});
      }
      await loadCounts();
    };
    run();
    const interval = setInterval(loadCounts, 15000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [workspaceId, activeSection]);

  return (
    <Tabs value={active}>
      <TabsList className="flex-wrap">
        {tabs.map((tab) => {
          const count = tab.section && tab.slug !== active ? unseen[tab.section] ?? 0 : 0;
          return (
            <TabsTrigger key={tab.slug} value={tab.slug} asChild>
              <Link href={`/workspace/${workspaceId}/${tab.slug}`} className="relative">
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
