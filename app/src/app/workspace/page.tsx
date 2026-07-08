import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listWorkspacesForUser } from "@/lib/db";
import { LogoutButton } from "@/components/logout-button";
import { Building2 } from "lucide-react";

export default async function WorkspacePickerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  const workspaces = await listWorkspacesForUser(user.id);

  if (workspaces.length === 1) {
    redirect(`/workspace/${workspaces[0].id}/inspiration`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Your workspaces</h1>
        <LogoutButton />
      </div>
      {workspaces.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No workspaces assigned yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Contact your account manager.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Link
                href={`/workspace/${w.id}/inspiration`}
                className="glass flex items-center gap-3 rounded-xl p-4 hover:bg-white/[0.05]"
              >
                <Building2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium">{w.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
