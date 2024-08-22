"use client";

import React, { useEffect, useRef, useState } from "react";
import ChatBottombar from "./chatBottombar";
import { AnimatePresence } from "framer-motion";
import { leadNamespace } from "@/types/lead";
import { InstagramNamespace, Messages } from "@/types/instagram";
import InfiniteScroll from "react-infinite-scroll-component";
import Message from "./message";
import SendingMessage, { SendingMessageType } from "./sendingMessage";
import { socket } from "@/app/utils/socket";
import { WsMessages } from "@/ws.messages";

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

  const [lastPageRecived, setLastPageRecived] = useState<number>();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  useEffect(() => {
    socket.emit(WsMessages.CONVERSATION, { leadId: lead?.id });

    socket.on(WsMessages.CONVERSATION, (conversationStr) => {
      const conversation: InstagramNamespace.GET['Conversation'] = JSON.parse(conversationStr)
      if (conversation.items.length === 0) {
        setHasMore(false);
        return;
      }
      setMessagesList((old) => [...old, ...conversation.items]);
    });
  }, [lead]);

  useEffect(() => {
    socket.on(WsMessages.NEW_MESSAGE, (data) => {

      console.log(JSON.parse(data));
      
      setMessagesList((old) => [JSON.parse(data), ...old]);
    })

  }, [lead])

  useEffect(() => {
    socket.on(WsMessages.MESSAGE_SENT, (messageStr) => {
      const message: Messages & {digest: number} = JSON.parse(messageStr)
      setSendingMessages((old) => old.filter((m) => m.digest !== message.digest))
      console.log(message);
      setMessagesList((old) => [message, ...old]);
    })
  }, [lead])

  const next = () => {
    socket.emit(WsMessages.CONVERSATION, { leadId: lead?.id, page: page+1, after: btoa(messagesList[0].sendDate) })
    setPage((old) => old+1)
  }

  if (!lead?.id) {
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
              <div key={index} >
                <p>{message.sendDate} {message.id}</p>
                <Message
                  message={message}
                  key={message.id}
                  lead={lead}
                  messagesList={messagesList}
                />
              </div>
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
