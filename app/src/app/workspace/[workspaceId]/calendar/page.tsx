import { CalendarTab } from "@/components/calendar-tab";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <CalendarTab workspaceId={workspaceId} />;
}
