import { FootageTab } from "@/components/footage-tab";

export default async function FootagePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <FootageTab workspaceId={workspaceId} />;
}
