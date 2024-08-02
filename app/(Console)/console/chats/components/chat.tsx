"use client";
import { Message, UserData } from "./data";
import ChatTopbar from "./chatTopbar";
import { ChatList } from "./chatList";
import React, { useEffect, useState } from "react";
import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";
import useSWR from "swr";
import { InstagramNamespace } from "@/types/instagram";
import { fetcher } from "@/hooks/swr/fetcher";
import { leadNamespace } from "@/types/lead";

interface ChatProps {
  leadId: string;
}

export function Chat({ leadId }: ChatProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    sessionStorage.getItem(SessionStorageKeys.IS_MOBILE) === "true"
      ? setIsMobile(true)
      : setIsMobile(false);
  }, []);

  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
  } = useSWR<leadNamespace.GET["One"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/leads/${leadId}?limit=20&page=1`,
    fetcher
  );

  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useSWR<InstagramNamespace.GET["Conversation"]>(
    lead?.id
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations/${leadId}?limit=20&page=1`
      : null,
    fetcher
  );

  console.log(lead);
  console.log(messages);

  // const [messagesState, setMessages] = React.useState<Message[]>(
  //   messages ?? []
  // );

  // const sendMessage = (newMessage: Message) => {
  //   setMessages([...messagesState, newMessage]);
  // };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar lead={lead} />
{/* 
      <ChatList
        messages={messagesState}
        selectedUser={selectedUser}
        sendMessage={sendMessage}
        isMobile={isMobile}
      /> */}
    </div>
  );
}
