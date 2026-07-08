import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNotesTab } from "@/components/admin-notes-tab";

// Admin-only. Clients never get here (the tab isn't rendered for them, and this
// guard blocks direct navigation).
export default async function AdminNotesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  return <AdminNotesTab workspaceId={workspaceId} />;
}
