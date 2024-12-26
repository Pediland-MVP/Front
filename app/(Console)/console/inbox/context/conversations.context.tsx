"use client";

import { messagesSocket } from "@/app/utils/socket";
import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import { WsMessageSent } from "@/types/conversations/messageSent.ws";
import { WsNewMessage } from "@/types/conversations/newMessage.ws";
import { WsMessages } from "@/ws.messages";
import { createContext, useContext, useEffect, useState } from "react";

export type ConversationsContextType = {
  conversations: ConversationNamespace.WS.Conversations["items"];
  setConversations: React.Dispatch<
    React.SetStateAction<ConversationNamespace.WS.Conversations["items"]>
  >;
  addNewConversation: (conversation: ConversationNamespace.WS.NewConversation) => void;
};

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

export const ConversationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [conversations, setConversations] = useState<
    ConversationNamespace.WS.Conversations["items"]
  >([]);

  const addNewConversation = (conversation: ConversationNamespace.WS.NewConversation) => {
    setConversations(old => {
      const find = old.find(c => c.id === conversation.id)
      if (find) {
        return old
      }
      return [conversation, ...old]
    })
  }

  const updateLastMessageOfConversation = (
    message: WsMessageSent | WsNewMessage
  ) => {
    setConversations((old) => {
      const conversation = old.find((c) => {
        return c.id === message.lead.id;
      });
      if (conversation) {
        // Conversation.messages is array but we just show last message on it
        conversation.messages = [message];
        return [...old];
      }
      return old;
    });
  };

  useEffect(() => {
    messagesSocket.on(WsMessages.NEW_MESSAGE, (data) => {
      const message: WsNewMessage = JSON.parse(data);
      updateLastMessageOfConversation(message);
    });

    messagesSocket.on(WsMessages.MESSAGE_SENT, (data) => {
      const message: WsNewMessage = JSON.parse(data);
      updateLastMessageOfConversation(message)
    });

    return () => {
      messagesSocket.off(WsMessages.NEW_MESSAGE)
      messagesSocket.off(WsMessages.MESSAGE_SENT)
    }
  },[]) 

  return (
    <ConversationsContext.Provider value={{ conversations, setConversations, addNewConversation }}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider"
    );
  }
  return context;
};
