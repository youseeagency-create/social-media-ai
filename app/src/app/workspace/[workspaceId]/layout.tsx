import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getWorkspaceById, isUserAssignedToWorkspace } from "@/lib/db";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { WorkspaceSearchBox } from "@/components/workspace-search-box";
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

  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) notFound();

  const isAdmin = user.role === "admin";
  if (!isAdmin) {
    const allowed = await isUserAssignedToWorkspace(workspaceId, user.id);
    // Archived workspaces are deactivated for clients entirely.
    if (!allowed || workspace.archivedAt) notFound();
  }

  const backHref = isAdmin ? "/admin" : "/workspace";
  const backLabel = isAdmin ? "Dashboard" : "Workspaces";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
          <h1 className="text-sm font-semibold">
            {workspace.name}
            {workspace.archivedAt && (
              <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                Archived
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <WorkspaceSearchBox workspaceId={workspaceId} />
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <WorkspaceTabs workspaceId={workspaceId} isAdmin={isAdmin} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
