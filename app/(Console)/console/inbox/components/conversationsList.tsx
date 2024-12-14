"use client";

import { memo, useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { messagesSocket } from "@/app/utils/socket";
import { Conversations, Item } from "@/types/instagram";
import InfiniteScroll from "react-infinite-scroll-component";
import ConversationsListSkeleton from "./conversationsList.skeleton";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/theme/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/components/theme/ui/sidebar";
import {
  ArrowLeft,
  DotsThreeVertical,
  Sidebar,
} from "@phosphor-icons/react/dist/ssr";
import LoadingSpinner from "@/components/ui/loadingSpinner";

function ConversationsList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 15;

  const sidebar = useSidebar();
  const selectedChatId = useParams()?.chatId as string | undefined;

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
  }, []);

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

  const t = useTranslations("Inbox.ConversationsList");

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const conversationClickHandler = (chatId: string) => () => {
    router.push(`/console/inbox/${chatId}`);
  };

  useEffect(() => {
    if (selectedChatId) {
      router.push(`/console/inbox/${selectedChatId}`);
    }
  }, [isSmallDevice, isMediumDevice, selectedChatId, router]);

  const isConversationsListHidden =
    (isSmallDevice || isMediumDevice) && selectedChatId;

  if (!conversations.length && isLoading) {
    return <ConversationsListSkeleton />;
  }

  if(!conversations.length) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p>{t("noConversations")}</p>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {!isConversationsListHidden && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="lg:w-1/3 lg:max-h-[calc(100vh-138px)] max-h-svh w-full h-full"
        >
          <Card className="w-full h-full p-4 box-border bg-background overflow-hidden flex flex-col">
            <div className="w-full flex lg:hidden justify-between mb-4">
              <Sidebar
                onClick={() => sidebar.setOpenMobile(true)}
                className="text-muted-foreground"
                height={30}
                width={30}
              />
              <ArrowLeft
                onClick={() => router.push("/console")}
                className="text-muted-foreground"
                height={30}
                width={30}
              />
            </div>
            <div
              id="chats-container"
              className="flex-grow overflow-y-auto w-full"
            >
              <InfiniteScroll
                dataLength={conversations.length}
                next={fetchConversations}
                hasMore={hasMore}
                loader={
                  <div className="w-full flex justify-center items-center text-center py-4">
                    <LoadingSpinner />
                  </div>
                }
                scrollableTarget="chats-container"
                className="overflow-hidden"
              >
                <div className="w-full">
                  {conversations.map((chat, index) => (
                    <div
                      onClick={conversationClickHandler(chat.id)}
                      key={chat.id || index}
                      className="flex p-2 items-center gap-4 box-border rounded-lg hover:bg-accent duration-300 cursor-pointer"
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
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium">
                          {chat.firstname} {chat.lastname || ""}
                        </span>
                        {chat.messages && (
                          <span className="text-muted-foreground text-xs truncate">
                            {chat.messages?.[0]?.text}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InfiniteScroll>
              {error && (
                <div className="text-center py-4 text-destructive">{error}</div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ConversationsList);
