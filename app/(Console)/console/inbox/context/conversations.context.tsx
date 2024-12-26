"use client";

import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import { createContext, useContext, useState } from "react";

export type ConversationsContextType = {
  conversations: ConversationNamespace.WS.Conversations["items"];
  setConversations: React.Dispatch<
    React.SetStateAction<ConversationNamespace.WS.Conversations["items"]>
  >;
  addNewConversation: (conversation: ConversationNamespace.WS.NewConversation) => void
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
