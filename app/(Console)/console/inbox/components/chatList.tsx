"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBottombar from "./chatBottombar";
import { AnimatePresence } from "framer-motion";
import { leadNamespace } from "@/types/lead";
import { InstagramNamespace, Messages } from "@/types/instagram";
import InfiniteScroll from "react-infinite-scroll-component";
import Message, { IMessage } from "./message";
import { SendingMessageType } from "./sendingMessage";
import { socket } from "@/app/utils/socket";
import { WsMessages } from "@/ws.messages";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface ChatScreenProps {
  lead?: leadNamespace.GET["One"];
  isMobile: boolean;
}

export function ChatList({ lead, isMobile }: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const limit = 13;
  const [messagesList, setMessagesList] = useState<IMessage[]>([]);
  const [sendingMessages, setSendingMessages] = useState<SendingMessageType[]>(
    []
  );
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  useEffect(() => {
    console.log(messagesList);
  }, [messagesList]);

  let isListenersSet = false;

  useEffect(() => {
    if (isListenersSet) return;
    isListenersSet = true;

    socket.emit(WsMessages.CONVERSATION, { leadId: lead?.id });

    socket.on(WsMessages.CONVERSATION, (conversationStr) => {
      const conversation: InstagramNamespace.GET["Conversation"] =
        JSON.parse(conversationStr);
      if (conversation.items.length === 0) {
        setHasMore(false);
        return;
      }
      setMessagesList((old) => [...old, ...conversation.items]);
    });

    socket.on(WsMessages.MESSAGE_SENT, (messageStr) => {
      const message: Messages & { digest: number } = JSON.parse(messageStr);
      setMessagesList((old) => [message, ...old]);
    });

    socket.on(WsMessages.NEW_MESSAGE, (data) => {
      console.log(JSON.parse(data));

      setMessagesList((old) => [JSON.parse(data), ...old]);
    });

    return () => {
      socket.off(WsMessages.CONVERSATION);
      socket.off(WsMessages.MESSAGE_SENT);
      socket.off(WsMessages.NEW_MESSAGE);
    };
  }, [lead]);

  const next = () => {
    const lastMessage = messagesList.find((m) => m?.sendDate)?.sendDate;
    if (!lastMessage) return;
    socket.emit(WsMessages.CONVERSATION, {
      leadId: lead?.id,
      page: page + 1,
      after: btoa(lastMessage),
    });
    setPage((old) => old + 1);
  };

  if (!lead?.id) {
    return (
      <div>
        {" "}
        <LoadingSpinner size="sm" className="w-4 h-4 mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <AnimatePresence>
        <div
          id="chat-container"
          ref={messagesContainerRef}
          className="w-full overflow-y-auto overflow-x-hidden h-[10%] flex flex-col-reverse"
        >
          <InfiniteScroll
            dataLength={messagesList.length} // Length of the messages array
            next={next} // Function to fetch more data
            hasMore={hasMore} // Boolean to indicate whether more data is available
            loader={<LoadingSpinner className="w-6 h-6  mx-auto" />} // A spinner or loading component
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
                key={message.id}
                lead={lead}
                messagesList={messagesList}
              />
            ))}
          </InfiniteScroll>
        </div>
      </AnimatePresence>
      <ChatBottombar
        setMessagesList={setMessagesList}
        messagesList={messagesList}
        isMobile={isMobile}
      />
    </div>
  );
}
