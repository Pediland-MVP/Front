"use client";
import ChatTopbar from "./chatTopbar";
import { ChatMessages } from "./chatMessages";
import { useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/swr/fetcher";
import { leadNamespace } from "@/types/lead";
import useCurrentLead from "@/store/currentLead.store";
import ChatBottombar from "./chatBottombar";
import { Card } from "@/components/theme/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import useFetchMessages from "./useFetchMessages";
import ChatSkeleton from "./chat.skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ChatProps {
  leadId: string;
}

export function Chat({ leadId }: ChatProps) {
  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const { setCurrentLead } = useCurrentLead();

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

  const messagesData = useFetchMessages(lead);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="w-full md:w-2/3 bg-white h-full border-l-2 border-gray-100"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        {!messagesData?.messagesList?.length ? (
          <ChatSkeleton />
        ) : (
          <Card className="flex w-full h-full p-5">
            <div className="w-full flex flex-col overflow-y-auto h-svh lg:max-h-[calc(100vh-138px)]">
              <ChatTopbar lead={lead} />
              <ChatMessages messagesData={messagesData} lead={lead} />
              <ChatBottombar />
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
