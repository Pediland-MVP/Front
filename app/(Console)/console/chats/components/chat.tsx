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
import useCurrentLead from "@/store/currentLead.store";

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

  const { setCurrentLead } = useCurrentLead()

  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
  } = useSWR<leadNamespace.GET["One"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/leads/${leadId}?limit=20&page=1`,
    fetcher
  );



  useEffect(() => {
    if (lead) {
      setCurrentLead(lead)
    }
  }, [lead])


  


  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar lead={lead} />
      <ChatList
        lead={lead}
        isMobile={isMobile}
      />
    </div>
  );
}
