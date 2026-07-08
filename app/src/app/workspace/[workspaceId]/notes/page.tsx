import { NotesTab } from "@/components/notes-tab";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <NotesTab workspaceId={workspaceId} />;
}
