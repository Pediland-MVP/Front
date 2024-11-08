import { Chat } from "../components/chat";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {

  const { chatId } = await params

  return (
    <div className="w-full">
      <Chat leadId={chatId} />
    </div>
  );
}
