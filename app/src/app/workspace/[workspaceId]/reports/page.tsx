import { ReportsTab } from "@/components/reports-tab";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <ReportsTab workspaceId={workspaceId} />;
}
