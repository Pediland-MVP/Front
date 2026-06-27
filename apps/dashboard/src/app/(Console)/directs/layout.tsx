'use client';

import { FC } from 'react';
import { useTranslations } from 'next-intl';
// Just UI Imports Below
import ConversationsList from './components/conversationsList';
import { ConversationNamespace } from '@/types/conversations/conversation.namespace';
import { ConversationsProvider } from './context/conversations.context';

type ChatsLayout = {
  children: React.ReactNode;
};

export type ConversationsContextType = {
  conversations: ConversationNamespace.WS.Conversations['items'];
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations('Inbox');
  return (
    <div className="_direct flex h-full max-h-full flex-col overflow-hidden">
      <div className="_chat-layout flex min-h-[calc(100vh-5.5rem)] w-full flex-col overflow-auto lg:flex-row">
        <ConversationsProvider>
          <ConversationsList />
          {children}
        </ConversationsProvider>
      </div>
    </div>
  );
};

export default ChatsLayout;
