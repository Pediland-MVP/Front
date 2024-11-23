"use client";
import ChatTopbar from "./chatTopbar";
import { ChatList } from "./chatList";
import { useEffect, useState } from "react";
import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";
import useSWR from "swr";
import { fetcher } from "@/hooks/swr/fetcher";
import { leadNamespace } from "@/types/lead";
import useCurrentLead from "@/store/currentLead.store";
import { useTabStore } from "@/store/tabActiveStore";
import ChatBottombar from "./chatBottombar";
import { IMessage } from "./message";
import { Card } from "@/components/theme/ui/card";

interface ChatProps {
  leadId: string;
}

export function Chat({ leadId }: ChatProps) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { activeTab } = useTabStore();
  useEffect(() => {
    sessionStorage.getItem(SessionStorageKeys.IS_MOBILE) === "true"
      ? setIsMobile(true)
      : setIsMobile(false);
  }, []);

  const { setCurrentLead } = useCurrentLead();

  const [messagesList, setMessagesList] = useState<IMessage[]>([]);

  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
  } = useSWR<leadNamespace.GET["One"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/leads/${leadId}?leadInstagram=true`,
    fetcher
  );

  useEffect(() => {
    if (lead) {
      setCurrentLead(lead);
    }

    console.log(`Current lead`, lead);
  }, [lead]);

  return (
    <>
      {activeTab === "chat" && (
        <Card>
          <div className="flex flex-col overflow-y-auto max-h-[calc(100vh-138px)]">
            <ChatTopbar lead={lead} />
            <ChatList lead={lead} isMobile={isMobile} />
            <ChatBottombar
              setMessagesList={setMessagesList}
              messagesList={messagesList}
              isMobile={isMobile}
            />
          </div>
        </Card>
      )}
    </>
  );
}
