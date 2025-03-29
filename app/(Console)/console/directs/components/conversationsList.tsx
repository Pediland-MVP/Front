"use client";

import { memo, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { messagesSocket } from "@/app/utils/socket";
import ConversationsListSkeleton from "./conversationsList.skeleton";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/theme/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/components/theme/ui/sidebar";
import { ArrowLeft, Sidebar } from "@phosphor-icons/react/dist/ssr";
import LoadingSpinner from "@/components/ui/loadingSpinner";

import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import { useConversations } from "../context/conversations.context";
import { WsMessageEvents } from "@/types/conversations/wsMessage.enum";
import InfiniteScroll from "@/components/theme/ui/infinite-scroll";

const LIMIT = 15;
function ConversationsList() {
  const router = useRouter();
  const { conversations, setConversations, addNewConversation } =
    useConversations();
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
      messagesSocket.emit("conversations", {
        page: updatedPage,
        limit: LIMIT,
      });
      return updatedPage;
    });
  }, []);

  const handleConversations = useCallback((conversationsData: string) => {
    try {
      const newConversations = JSON.parse(
        conversationsData
      ) as ConversationNamespace.WS.Conversations;
      setConversations((prevConversations) => [
        ...prevConversations,
        ...newConversations.items,
      ]);
      setHasMore(newConversations.items.length === LIMIT);
    } catch (error) {
      setError("Error parsing conversations data");
      console.error("Error handling conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewConversation = useCallback((conversationData: string) => {
    try {
      const newConversation = JSON.parse(
        conversationData
      ) as ConversationNamespace.WS.NewConversation;
      addNewConversation(newConversation);
    } catch (error) {
      console.error("Error handling new conversation:", error);
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
      messagesSocket.off(
        WsMessageEvents.NEW_CONVERSATION,
        handleNewConversation
      );
    };
  }, []);

  const t = useTranslations("Inbox");

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const conversationClickHandler = (chatId: string) => () => {
    router.push(`/console/directs/${chatId}`);
  };

  useEffect(() => {
    if (selectedChatId) {
      router.push(`/console/directs/${selectedChatId}`);
    }
  }, [isSmallDevice, isMediumDevice, selectedChatId, router]);

  const isConversationsListHidden =
    (isSmallDevice || isMediumDevice) && selectedChatId;

  if (!conversations.length && isLoading) {
    return <ConversationsListSkeleton />;
  }

  if (!conversations.length) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-muted-foreground">{t("noConversations")}</p>
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
          className="lg:w-1/3 w-full h-full bg-white"
        >
          <Card className="w-full h-full p-4 box-border overflow-hidden flex flex-col border-l-2 border-gray-100">
            <div
              id="chats-container"
              className="flex-grow overflow-y-auto w-full"
            >
              <div
                id="comments-container"
                className="w-full _wrap min-h-[600px] max-h-[calc(100vh - 900px)] overflow-y-auto "
              >
                <div className="w-full flex flex-col">
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
                        alt={chat.firstname || ""}
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
                  <InfiniteScroll
                    threshold={1}
                    isLoading={isLoading}
                    next={fetchConversations}
                    hasMore={hasMore}
                  >
                    {hasMore && (
                      <div className="w-full flex justify-center items-center text-center py-4">
                        <LoadingSpinner />
                      </div>
                    )}
                  </InfiniteScroll>
                </div>
                {/* <div className="w-full"> */}
                {error && (
                  <div className="text-center py-4 text-destructive">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(ConversationsList);
