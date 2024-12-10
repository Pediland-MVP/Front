"use client";

import {
  memo,
  useEffect,
  useState,
  useCallback
} from "react";
import Image from "next/image";
import { messagesSocket } from "@/app/utils/socket";
import { Conversations, Item } from "@/types/instagram";
import InfiniteScroll from "react-infinite-scroll-component";
import ConversationsListSkeleton from "./conversationsList.skeleton";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/theme/ui/card";
import { AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/components/theme/ui/sidebar";
import { ArrowLeft, DotsThreeVertical, Sidebar } from "@phosphor-icons/react/dist/ssr";


function ConversationsList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 15;


  const sidebar = useSidebar()
  // Get chatId
  const selectedChatId = useParams()?.chatId as string | undefined;

  // Fetch all conversations when page number changes
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

  const t = useTranslations("Inbox.ConversationsList");

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const conversationClickHandler = (chatId: string) => () => {
    // if (isSmallDevice || isMediumDevice) {
    //   setSelectedChatId(chatId);
    //   router.push("/console/inbox?conversation");
    // }
    router.push(`/console/inbox/${chatId}`);
  };


  useEffect(() => {
    if (selectedChatId) {
      router.push(`/console/inbox/${selectedChatId}`);
    }
  }, [isSmallDevice, isMediumDevice]);

  // const [isConversationsHidden, setIsConversationHidden] = useState()
  const isConversationsListHidden =
    (isSmallDevice || isMediumDevice) && selectedChatId;

  if (!conversations.length && isLoading) {
    return <ConversationsListSkeleton />;
  }

  return (
    <>
      {!isConversationsListHidden && (
        <AnimatePresence>
          <Card className="lg:w-1/3 lg:max-h-[calc(100vh-138px)] w-full h-full p-4 box-border">
            <div className="w-full flex lg:hidden justify-between mb-4">
              <Sidebar onClick={() => sidebar.setOpenMobile(true)} className="text-black/20" height={30} width={30} />
              <ArrowLeft onClick={() => router.push('/console')} className="text-black/20" height={30} width={30} />
            </div>
            <div
              id="chats-container"
              className="_chat-list group"
            >
              <InfiniteScroll
                dataLength={conversations.length}
                next={fetchConversations}
                hasMore={hasMore}
                loader={<div className="text-center py-4">{t("loading")}</div>}
                // endMessage={
                //   <div className="text-center py-4">
                //     {t("thereAreNoMoreChats")}
                //   </div>
                // }
                scrollableTarget="chats-container"
              >
                <nav className="gap overflow-y-hidden">
                  {conversations.map((chat, index) => (
                    <div
                      onClick={conversationClickHandler(chat.id)}
                      key={chat.id || index}
                      className="flex p-2 items-center gap-4 box-border rounded-lg hover:bg-gray-100 duration-300"
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
                    </div>
                  ))}
                </nav>
              </InfiniteScroll>
              {error && (
                <div className="text-center py-4 text-red-500">{error}</div>
              )}
            </div>
          </Card>
        </AnimatePresence>
      )}
    </>
  );
}

export default memo(ConversationsList);
