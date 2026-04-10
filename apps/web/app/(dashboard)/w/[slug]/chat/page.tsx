import { ChatPage } from "@/features/chat/components/chat-page";

export default async function AssistantChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChatPage workspaceSlug={slug} />;
}
