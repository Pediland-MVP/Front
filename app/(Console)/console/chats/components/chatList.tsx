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
import useImmutableSWR from 'swr/immutable'
import InfiniteScroll from "react-infinite-scroll-component";

interface ChatScreenProps {
  lead?: leadNamespace.GET["One"];
  isMobile: boolean;
}

export function ChatList({ lead, isMobile }: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const limit = 13;
  const [messagesList, setMessagesList] = useState<Messages[]>([]);

  useEffect(() => {
    console.log(messagesList, messagesList.length);
    
  }, [messagesList])

  const [lastPageRecived, setLastPageRecived] = useState<number>();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  useEffect(() => console.log(hasMore), [hasMore]);

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
    mutate: mutateMessages
  } = useSWR<InstagramNamespace.GET["Conversation"]>(
    lead?.id
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations/${lead.id}?limit=${limit}&page=${page}`
      : null,
    fetcher
  );


  useEffect(() => {
    if (!messages) return;
    if (messages.items.length === 0) {
      setHasMore(false)
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
            style={{ display: "flex", flexDirection: "column-reverse", overflowY: 'hidden' }} // Keep the messages at the bottom
          >
            {messagesList?.map((message, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                transition={{
                  opacity: { duration: 0.1 },
                  layout: {
                    type: "spring",
                    bounce: 0.3,
                    duration: messagesList.indexOf(message) * 0.05 + 0.2,
                  },
                }}
                style={{
                  originX: 0.5,
                  originY: 0.5,
                }}
                className={cn(
                  "flex flex-col gap-2 p-4 whitespace-pre-wrap",
                  message.from === "lead" ? "items-end" : "items-start"
                )}
              >
                {index}
                <div className="flex gap-3 items-center">
                  <span className=" bg-accent p-3 rounded-md max-w-xs">
                    {message.text}
                  </span>
                  {message.from === "lead" && (
                    <Avatar className="flex justify-center items-center">
                      <AvatarImage
                        src={lead.profilePic}
                        alt={lead.profilePic}
                        width={6}
                        height={6}
                      />
                    </Avatar>
                  )}
                  {message.from !== "lead" && (
                    <Avatar className="flex justify-center items-center">
                      <AvatarImage
                        src={lead.instagram.profilePictureUrl}
                        alt={lead.instagram.firstname}
                        width={6}
                        height={6}
                      />
                    </Avatar>
                  )}
                </div>
              </motion.div>
            ))}
          </InfiniteScroll>
        </div>
      </AnimatePresence>
      <ChatBottombar isMobile={isMobile} />
    </div>
  );
}
