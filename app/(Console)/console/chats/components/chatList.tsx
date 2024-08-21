"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import ChatBottombar from "./chatBottombar";
import { AnimatePresence, motion } from "framer-motion";
import { leadNamespace } from "@/types/lead";
import { InstagramNamespace, Messages } from "@/types/instagram";
import { fetcher } from "@/hooks/swr/fetcher";
import useSWR, { mutate } from "swr";
import InfiniteScroll from "react-infinite-scroll-component";
import Message from "./message";
import SendingMessage, { SendingMessageType } from "./sendingMessage";

interface ChatScreenProps {
  lead?: leadNamespace.GET["One"];
  isMobile: boolean;
}

export function ChatList({ lead, isMobile }: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const limit = 13;
  const [messagesList, setMessagesList] = useState<Messages[]>([]);
  const [sendingMessages, setSendingMessages] = useState<SendingMessageType[]>(
    []
  );

  useEffect(() => {
    console.log(messagesList, messagesList.length);
  }, [messagesList]);

  const [lastPageRecived, setLastPageRecived] = useState<number>();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  useEffect(() => console.log(hasMore), [hasMore]);

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
    mutate: mutateMessages,
  } = useSWR<InstagramNamespace.GET["Conversation"]>(
    lead?.id
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations/${lead.id}?limit=${limit}&page=${page}`
      : null,
    fetcher
  );

  useEffect(() => {
    if (!messages) return;
    if (messages.items.length === 0) {
      setHasMore(false);
      return;
    }
    if (messages.meta.currentPage === lastPageRecived) return;
    setLastPageRecived(messages.meta.currentPage);
    setMessagesList((prevMessages) => [...prevMessages, ...messages.items]);
  }, [messages, lastPageRecived]);

  const checkHasMore = () => {
    if (!messages?.items.length || messages!.items.length < limit) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  };

  const next = async () => {
    setPage((prev) => prev + 1);
    await mutate(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations/${
        lead?.id
      }?limit=${limit}&page=${page + 1}`
    );
    checkHasMore();
  };

  // useEffect(() => {
  //   if (messagesContainerRef.current) {
  //     messagesContainerRef.current.scrollTop =
  //       messagesContainerRef.current.scrollHeight;
  //   }
  // }, [messagesList]);

  if (!lead) {
    return <div>Loading</div>;
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <AnimatePresence>
        <div
          id="chat-container"
          ref={messagesContainerRef}
          className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col-reverse"
        >
          {sendingMessages?.map((message, index) => (
            <SendingMessage message={message} lead={lead} key={index} />
          ))}
          <InfiniteScroll
            dataLength={messagesList.length} // Length of the messages array
            next={next} // Function to fetch more data
            hasMore={hasMore} // Boolean to indicate whether more data is available
            loader={<h4>Loading...</h4>} // A spinner or loading component
            inverse={true} // To load items in reverse order (top down)
            endMessage={
              <p className="text-sm text-center mt-2 text-gray-500">
                <p>دیگه پیامی نیست!</p>
              </p>
            }
            scrollableTarget="chat-container" // The ID of the scrollable div
            style={{
              display: "flex",
              flexDirection: "column-reverse",
              overflowY: "hidden",
            }} // Keep the messages at the bottom
          >
            {messagesList?.map((message, index) => (
              <Message
                message={message}
                key={index}
                lead={lead}
                messagesList={messagesList}
              />
            ))}
          </InfiniteScroll>
        </div>
      </AnimatePresence>
      <ChatBottombar
        setSendingMessages={setSendingMessages}
        sendingMessages={sendingMessages}
        isMobile={isMobile}
      />
    </div>
  );
}
