import { redirect } from "next/navigation";

// The workspace index always lands on the Home overview.
export default async function WorkspaceIndex({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  redirect(`/workspace/${workspaceId}/home`);
}
