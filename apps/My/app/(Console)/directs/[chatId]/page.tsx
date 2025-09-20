import { Chat } from "../components/chat";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <Chat leadId={chatId} />;
}
