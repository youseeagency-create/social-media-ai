import { AnalysisTab } from "@/components/analysis-tab";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <AnalysisTab workspaceId={workspaceId} />;
}
