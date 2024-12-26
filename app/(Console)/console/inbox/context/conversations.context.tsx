"use client";

import { messagesSocket } from "@/app/utils/socket";
import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import { WsMessageSent } from "@/types/conversations/messageSent.ws";
import { WsNewMessage } from "@/types/conversations/newMessage.ws";
import { WsMessageEvents } from "@/types/conversations/wsMessage.enum";

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
      // Find the index of the conversation with the given id
      const index = old.findIndex((c) => c.id === message.lead.id);
      
      if (index !== -1) {
        // Copy the old array to avoid mutating the state directly
        const updatedConversations = [...old];
        const conversation = updatedConversations[index];
        
        // Update the messages of the conversation
        conversation.messages = [message];
        
        // Remove the conversation from its current position
        updatedConversations.splice(index, 1);
        
        // Add the conversation to the beginning of the array
        updatedConversations.unshift(conversation);
        
        return updatedConversations;
      }
      
      return old;
    });
  };
  

  useEffect(() => {
    messagesSocket.on(WsMessageEvents.NEW_MESSAGE, (data) => {
      const message: WsNewMessage = JSON.parse(data);
      updateLastMessageOfConversation(message);
    });

    messagesSocket.on(WsMessageEvents.MESSAGE_SENT, (data) => {
      const message: WsNewMessage = JSON.parse(data);
      updateLastMessageOfConversation(message)
    });

    return () => {
      messagesSocket.off(WsMessageEvents.NEW_MESSAGE)
      messagesSocket.off(WsMessageEvents.MESSAGE_SENT)
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
