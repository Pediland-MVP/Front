"use client";

import { memo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { messagesSocket } from "@/app/utils/socket";
import { InstagramNamespace, Conversations, Item } from "@/types/instagram";
import InfiniteScroll from "react-infinite-scroll-component";
import ChatsListSkeleton from "./chatsList.skeleton";

interface ChatsListProps {
  isCollapsed: boolean;
  onClick?: () => void;
  isMobile: boolean;
}

function ChatsList({ isCollapsed, isMobile }: ChatsListProps) {
  const [conversations, setConversations] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 15;

  const fetchConversations = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setPage((prevPage) => {
      const updatedPage = prevPage + 1;
      messagesSocket.emit("conversations", {
        page: updatedPage,
        limit,
      });
      return updatedPage;
    });
  }, [page]);

  const handleConversations = useCallback((conversationsData: string) => {
    try {
      const newConversations = JSON.parse(conversationsData) as Conversations;
      setConversations((prevConversations) => [
        ...prevConversations,
        ...newConversations.items,
      ]);
      setHasMore(newConversations.items.length === limit);
    } catch (error) {
      setError("Error parsing conversations data");
      console.error("Error handling conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewConversation = useCallback((conversationData: string) => {
    try {
      const newConversation = JSON.parse(conversationData) as Item;
      setConversations((prevConversations) => {
        if (prevConversations.some((c) => c.id === newConversation.id)) {
          return prevConversations;
        }
        return [newConversation, ...prevConversations];
      });
    } catch (error) {
      console.error("Error handling new conversation:", error);
    }
  }, []);

  useEffect(() => {
    messagesSocket.on("conversations", handleConversations);
    messagesSocket.on("conversation.created", handleNewConversation);
    fetchConversations();

    return () => {
      messagesSocket.off("conversations", handleConversations);
      messagesSocket.off("conversation.created", handleNewConversation);
    };
  }, []);

  if (!conversations.length && isLoading) {
    return <ChatsListSkeleton />;
  }

  return (
    <div
      data-collapsed={isCollapsed}
      id="chats-container"
      className="_chat-list bg-white group rounded-lg shadow overflow-y-auto p-4 pl-2 max-h-[calc(100%-51px)] _wrap"
    >
      <InfiniteScroll
        dataLength={conversations.length}
        next={fetchConversations}
        hasMore={hasMore}
        loader={<div className="text-center py-4">درحال بارگزاری...</div>}
        endMessage={<div className="text-center py-4">تموم شد :)</div>}
        scrollableTarget="chats-container"
      >
        <nav className="grid group-[[data-collapsed=true]]:justify-center">
          {conversations.map((chat, index) => (
            <Link
              key={chat.id || index}
              href={`/console/inbox/${chat.id}`}
              className="flex p-2 items-center gap-4 rounded-lg hover:bg-gray-100 duration-300"
            >
              <Image
                src={
                  chat.leadInstagram?.profilePicture?.url ||
                  "/images/profile.png"
                }
                alt={chat.firstname}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span>
                  {chat.firstname} {chat.lastname || ""}
                </span>
                {chat.messages && (
                  <span className="text-zinc-300 text-xs truncate">
                    {chat.messages.text}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>
      </InfiniteScroll>
      {error && <div className="text-center py-4 text-red-500">{error}</div>}
    </div>
  );
}

export default memo(ChatsList);
