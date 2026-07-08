import { InspirationTab } from "@/components/inspiration-tab";

export default async function InspirationPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <InspirationTab workspaceId={workspaceId} />;
}
