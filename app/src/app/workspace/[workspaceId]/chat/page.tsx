import { getCurrentUser } from "@/lib/auth";
import { ChatTab } from "@/components/chat-tab";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await getCurrentUser();
  return <ChatTab workspaceId={workspaceId} currentUserId={user?.id ?? ""} />;
}
