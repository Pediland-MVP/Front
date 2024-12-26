"use client";

import { useEffect, useState } from "react";
import { messagesSocket } from "@/app/utils/socket";
import { WsMessages } from "@/ws.messages";
import { leadNamespace } from "@/types/lead";
import {
  WsConversation,
  WsConversationMessage,
} from "@/types/conversations/conversation.ws";
import { WsMessageSent } from "@/types/conversations/messageSent.ws";
import { WsNewMessage } from "@/types/conversations/newMessage.ws";
import { useConversations } from "../context/conversations.context";
import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import logger from "@/app/utils/logger";

export type UseFetchMessage = {
  next: () => void;
  hasMore: boolean;
  messagesList: (WsConversationMessage | WsMessageSent | WsNewMessage)[];
};

export default function useFetchMessages(
  lead?: leadNamespace.GET["One"]
): UseFetchMessage {
  const [messagesList, setMessagesList] = useState<
    (WsConversationMessage | WsMessageSent | WsNewMessage)[]
  >([]);
  const { updateLastMessageOfConversation } = useConversations();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  let isListenersSet = false;



  useEffect(() => {
    if (isListenersSet) return;
    isListenersSet = true;

    messagesSocket.emit(WsMessages.CONVERSATION, { leadId: lead?.id });

    messagesSocket.on(WsMessages.CONVERSATION, (conversationStr) => {
      //Get conversation data
      const conversation: WsConversation = JSON.parse(conversationStr);
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
    const lastMessageDate = messagesList.find((m) => m?.sendDate)?.sendDate;
    if (!lastMessageDate) return;
    messagesSocket.emit(WsMessages.CONVERSATION, {
      leadId: lead?.id,
      page: page + 1,
      after: btoa(lastMessageDate),
    });
    setPage((old) => old + 1);
  };

  return { next, hasMore, messagesList };
}
