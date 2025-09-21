"use client";

import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { leadNamespace } from "@/types/lead";
import InfiniteScroll from "react-infinite-scroll-component";
import Message from "./message";
import { LoaderSpin } from "@befroosh/ui-custom";
import { useTranslations } from "next-intl";
import { UseFetchMessage } from "./useFetchMessages";

interface ChatScreenProps {
  lead?: leadNamespace.GET["One"];
  messagesData: UseFetchMessage;
}

export function ChatMessages({ lead, messagesData }: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("Inbox.ChatList");
  const { hasMore, messagesList, next } = messagesData;

  if (!lead?.id) {
    return (
      <div>
        <LoadingSpinner size="sm" className="w-4 h-4 mx-auto" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div
        id="chat-container"
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden flex flex-col-reverse _wrap bg-slate-50 h-full"
      >
        <InfiniteScroll
          dataLength={messagesList.length} // Length of the messages array
          next={next} // Function to fetch more data
          hasMore={hasMore} // Boolean to indicate whether more data is available
          loader={<LoadingSpinner className="w-6 h-6  mx-auto" />} // A spinner or loading component
          inverse={true} // To load items in reverse order (top down)
          endMessage={
            <p className="text-sm text-center mt-2 text-gray-500">
              <p>{t("thereAreNoMoreMessages")}</p>
            </p>
          }
          scrollableTarget="chat-container" // The ID of the scrollable div
          className="flex flex-col gap-1.5 p-3"
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            overflowY: "hidden",
          }} // Keep the messages at the bottom
        >
          {messagesList?.map((message, index) => (
            <Message
              message={message}
              key={message.id}
              lead={lead}
              messagesList={messagesList}
            />
          ))}
        </InfiniteScroll>
      </div>
    </AnimatePresence>
  );
}
