'use client';

import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { leadNamespace } from '@/types/lead';
import InfiniteScroll from 'react-infinite-scroll-component';
import Message from './message';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { useTranslations } from 'next-intl';
import { UseFetchMessage } from './useFetchMessages';

interface ChatScreenProps {
  lead?: leadNamespace.GET['One'];
  messagesData: UseFetchMessage;
}

export function ChatMessages({ lead, messagesData }: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const t = useTranslations('Inbox.ChatList');
  const { hasMore, messagesList, next } = messagesData;

  if (!lead?.id) {
    return (
      <div>
        <LoaderSpin size="sm" className="mx-auto h-4 w-4" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div
        id="chat-container"
        ref={messagesContainerRef}
        className="_wrap flex h-full w-full flex-col-reverse overflow-x-hidden overflow-y-auto bg-slate-50"
      >
        <InfiniteScroll
          dataLength={messagesList.length} // Length of the messages array
          next={next} // Function to fetch more data
          hasMore={hasMore} // Boolean to indicate whether more data is available
          loader={<LoaderSpin className="mx-auto h-6 w-6" />} // A spinner or loading component
          inverse={true} // To load items in reverse order (top down)
          endMessage={
            <p className="mt-2 text-center text-sm text-gray-500">
              <p>{t('thereAreNoMoreMessages')}</p>
            </p>
          }
          scrollableTarget="chat-container" // The ID of the scrollable div
          className="flex flex-col gap-1.5 p-3"
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            overflowY: 'hidden',
          }} // Keep the messages at the bottom
        >
          {messagesList?.map((message, index) => (
            <Message message={message} key={message.id} lead={lead} messagesList={messagesList} />
          ))}
        </InfiniteScroll>
      </div>
    </AnimatePresence>
  );
}
