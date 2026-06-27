'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { messagesSocket } from '@/utils/socket';
import ConversationsListSkeleton from './conversationsList.skeleton';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSidebar } from '@/components/ui/sidebar';
import { ArrowLeft, Sidebar } from '@phosphor-icons/react/dist/ssr';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

import { ConversationNamespace } from '@/types/conversations/conversation.namespace';
import { useConversations } from '../context/conversations.context';
import { WsMessageEvents } from '@/types/conversations/wsMessage.enum';
import InfiniteScroll from '@/components/ui/infinite-scroll';

const LIMIT = 15;
function ConversationsList() {
  const router = useRouter();
  const { conversations, setConversations, addNewConversation } = useConversations();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const sidebar = useSidebar();
  const selectedChatId = useParams()?.chatId as string | undefined;

  const fetchConversations = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setPage((prevPage) => {
      const updatedPage = prevPage + 1;
      messagesSocket.emit('conversations', {
        page: updatedPage,
        limit: LIMIT,
      });
      return updatedPage;
    });
  }, []);

  const handleConversations = useCallback((conversationsData: string) => {
    try {
      const newConversations = JSON.parse(
        conversationsData,
      ) as ConversationNamespace.WS.Conversations;
      setConversations((prevConversations) => [...prevConversations, ...newConversations.items]);
      setHasMore(newConversations.items.length === LIMIT);
    } catch (error) {
      setError('Error parsing conversations data');
      console.error('Error handling conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewConversation = useCallback((conversationData: string) => {
    try {
      const newConversation = JSON.parse(
        conversationData,
      ) as ConversationNamespace.WS.NewConversation;
      addNewConversation(newConversation);
    } catch (error) {
      console.error('Error handling new conversation:', error);
    }
  }, []);

  useEffect(() => {
    messagesSocket.on(WsMessageEvents.CONVERSATIONS, handleConversations);
    messagesSocket.on(WsMessageEvents.NEW_CONVERSATION, handleNewConversation);
    if (conversations.length === 0) {
      fetchConversations();
    }

    return () => {
      messagesSocket.off(WsMessageEvents.CONVERSATIONS, handleConversations);
      messagesSocket.off(WsMessageEvents.NEW_CONVERSATION, handleNewConversation);
    };
  }, []);

  const t = useTranslations('Inbox');

  const isSmallDevice = useMediaQuery('only screen and (max-width : 768px)');
  const isMediumDevice = useMediaQuery(
    'only screen and (min-width : 769px) and (max-width : 992px)',
  );

  const conversationClickHandler = (chatId: string) => () => {
    router.push(`/directs/${chatId}`);
  };

  useEffect(() => {
    if (selectedChatId) {
      router.push(`/directs/${selectedChatId}`);
    }
  }, [isSmallDevice, isMediumDevice, selectedChatId, router]);

  const isConversationsListHidden = (isSmallDevice || isMediumDevice) && selectedChatId;

  if (!conversations.length && isLoading) {
    return <ConversationsListSkeleton />;
  }

  if (!conversations.length) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">{t('noConversations')}</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isConversationsListHidden && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full bg-white lg:w-1/3"
        >
          <Card className="box-border flex h-full w-full flex-col overflow-hidden rounded-none border-l-2 border-gray-100 p-4">
            <div id="chats-container" className="w-full flex-grow overflow-y-auto">
              <div
                id="comments-container"
                className="_wrap max-h-[calc(100vh - 900px)] min-h-[600px] w-full overflow-y-auto"
              >
                <div className="flex w-full flex-col">
                  {conversations.map((chat, index) => (
                    <div
                      onClick={conversationClickHandler(chat.id)}
                      key={chat.id || index}
                      className="hover:bg-accent box-border flex cursor-pointer items-center gap-4 rounded-lg p-2 duration-300"
                    >
                      <Image
                        src={chat.leadInstagram?.profilePicture?.url || '/images/profile.png'}
                        alt={chat.firstname || ''}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium">
                          {chat.firstname} {chat.lastname || ''}
                        </span>
                        {chat.messages && (
                          <span className="text-muted-foreground truncate text-xs">
                            {chat.messages?.[0]?.text}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <InfiniteScroll
                    threshold={1}
                    isLoading={isLoading}
                    next={fetchConversations}
                    hasMore={hasMore}
                  >
                    {hasMore && (
                      <div className="flex w-full items-center justify-center py-4 text-center">
                        <LoaderSpin />
                      </div>
                    )}
                  </InfiniteScroll>
                </div>
                {/* <div className="w-full"> */}
                {error && <div className="text-destructive py-4 text-center">{error}</div>}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ConversationsList);
