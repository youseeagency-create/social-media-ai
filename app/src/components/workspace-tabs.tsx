"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { slug: "inspiration", label: "Inspiration" },
  { slug: "notes", label: "Notes" },
  { slug: "footage", label: "Footage" },
  { slug: "analysis", label: "Analysis" },
  { slug: "calendar", label: "Content Calendar" },
  { slug: "reports", label: "Reports" },
];

export function WorkspaceTabs({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const active = TABS.find((t) => pathname.endsWith(`/${t.slug}`))?.slug ?? TABS[0].slug;

  return (
    <Tabs value={active}>
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.slug} value={tab.slug} asChild>
            <Link href={`/workspace/${workspaceId}/${tab.slug}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
