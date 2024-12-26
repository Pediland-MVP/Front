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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  let isListenersSet = false;

  const onNewMessage = (data: string) => {
    const message: WsNewMessage = JSON.parse(data);
    if (message.lead.id === lead?.id) {
      setMessagesList((old) => [message, ...old]);
    }
  }

  const onMessageSent = (data: string) => {
    const message: WsMessageSent = JSON.parse(data);
    setMessagesList((old) => [message, ...old]);
  }

  const onConversation = (data: string) => {
    //Get conversation data
    const conversation: WsConversation = JSON.parse(data);
    if (conversation.items.length === 0) {
      setHasMore(false);
      return;
    }
    setMessagesList((old) => [...old, ...conversation.items]);
  }

  useEffect(() => {
    if (isListenersSet) return;
    isListenersSet = true;

    messagesSocket.emit(WsMessages.CONVERSATION, { leadId: lead?.id });

    messagesSocket.on(WsMessages.CONVERSATION, onConversation);
    messagesSocket.on(WsMessages.MESSAGE_SENT, onMessageSent);
    messagesSocket.on(WsMessages.NEW_MESSAGE, onNewMessage);

    return () => {
      messagesSocket.off(WsMessages.CONVERSATION, onConversation);
      messagesSocket.off(WsMessages.NEW_MESSAGE, onNewMessage);
      messagesSocket.off(WsMessages.MESSAGE_SENT, onMessageSent);
    };
  }, [lead]);

  const next = () => {
    const lastMessageDate = messagesList.find((m) => m?.sendDate)?.sendDate;
    if (!lastMessageDate) return;
    messagesSocket.emit(WsMessages.CONVERSATION, {
      leadId: lead?.id,
      page: page + 1,
      after: lastMessageDate,
    });
    setPage((old) => old + 1);
  };

  return { next, hasMore, messagesList };
}
