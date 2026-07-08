import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readWorkspaces, readWorkspaceClients } from "@/lib/csv";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { LogoutButton } from "@/components/logout-button";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = readWorkspaces().find((w) => w.id === workspaceId);
  if (!workspace) notFound();

  if (user.role !== "admin") {
    const allowed = readWorkspaceClients().some(
      (l) => l.workspaceId === workspaceId && l.userId === user.id
    );
    if (!allowed) notFound();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-background/80 px-6 py-4 backdrop-blur-xl">
        <h1 className="text-sm font-semibold">{workspace.name}</h1>
        <LogoutButton />
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <WorkspaceTabs workspaceId={workspaceId} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
