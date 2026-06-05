"use client";
import { Card } from "@/components/ui/card";
import useCurrentLead from "@/store/currentLead.store";
import { leadNamespace } from "@/types/lead";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import useSWR from "swr";
import ChatSkeleton from "./chat.skeleton";
import ChatBottombar from "./chatBottombar";
import { ChatMessages } from "./chatMessages";
import ChatTopbar from "./chatTopbar";
import useFetchMessages from "./useFetchMessages";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface ChatProps {
  leadId: string;
}

export function Chat({ leadId }: ChatProps) {
  const { setCurrentLead } = useCurrentLead();

  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
  } = useSWR<leadNamespace.GET["One"]>(
    `${API_URL}/leads/${leadId}?leadInstagram=true`,
  );

  useEffect(() => {
    if (lead) {
      setCurrentLead(lead);
    }
  }, [lead]);

  const messagesData = useFetchMessages(lead);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="h-full w-full border-l-2 border-gray-100 bg-white md:w-2/3"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        {!messagesData?.messagesList?.length ? (
          <ChatSkeleton />
        ) : (
          <Card className="flex h-full w-full p-5">
            <div className="flex h-svh w-full flex-col overflow-y-auto lg:max-h-[calc(100vh-138px)]">
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
