import { Chat } from "../components/chat";

export default async function ChatPage({
  params: { chatId },
}: {
  params: { chatId: string };
}) {

  return (
    <div className="w-full">
      <Chat leadId={chatId} />
    </div>
  );
}
