import { useEffect, useState } from "react";
import { IMessage } from "./message";
import { messagesSocket } from "@/app/utils/socket";
import { WsMessages } from "@/ws.messages";
import { InstagramNamespace, Messages } from "@/types/instagram";
import { leadNamespace } from "@/types/lead";
import { WsConversation, WsConversationItem } from "@/types/wsConversation";
import { WsMessageSent } from "@/types/wsMessageSent";
import logger from "@/app/utils/logger";
import { WsNewMessage } from "@/types/wsNewMessage";

export type UseFetchMessage = {
  next: () => void;
  hasMore: boolean;
  messagesList: (WsConversationItem | WsMessageSent | WsNewMessage)[];
};

export default function useFetchMessages(
  lead?: leadNamespace.GET["One"]
): UseFetchMessage {
  const limit = 13;
  const [messagesList, setMessagesList] = useState<(WsConversationItem | WsMessageSent | WsNewMessage)[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  let isListenersSet = false;

  useEffect(() => {
    if (isListenersSet) return;
    isListenersSet = true;
    

    messagesSocket.emit(WsMessages.CONVERSATION, { leadId: lead?.id });

    messagesSocket.on(WsMessages.CONVERSATION, (conversationStr) => {
      //Get conversation data
      const conversation: WsConversation =
        JSON.parse(conversationStr);
      if (conversation.items.length === 0) {
        setHasMore(false);
        return;
      }
      setMessagesList((old) => [...old, ...conversation.items]);
    });


    messagesSocket.on(WsMessages.MESSAGE_SENT, (messageStr) => {
      const message: WsMessageSent = JSON.parse(messageStr);
      setMessagesList((old) => [message, ...old]);
    });

    messagesSocket.on(WsMessages.NEW_MESSAGE, (data) => {
      const message: WsNewMessage = JSON.parse(data);
      if (message.lead.id === lead?.id) {
        setMessagesList((old) => [message, ...old]);
      }
    });

    return () => {
      messagesSocket.off(WsMessages.CONVERSATION);
      messagesSocket.off(WsMessages.NEW_MESSAGE);
      messagesSocket.off(WsMessages.MESSAGE_SENT);
    };
  }, [lead]);

  const next = () => {
    const lastMessage = messagesList.find((m) => m?.sendDate)?.sendDate;
    if (!lastMessage) return;
    messagesSocket.emit(WsMessages.CONVERSATION, {
      leadId: lead?.id,
      page: page + 1,
      after: btoa(lastMessage),
    });
    setPage((old) => old + 1);
  };

  return { next, hasMore, messagesList };
}
