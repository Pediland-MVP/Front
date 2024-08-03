import { Message, UserData } from "./data";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import ChatBottombar from "./chatBottombar";
import { AnimatePresence, motion } from "framer-motion";
import { leadNamespace } from "@/types/lead";
import { InstagramNamespace } from "@/types/instagram";

interface ChatScreenProps {
  messages?: InstagramNamespace.GET["Conversation"];
  lead?: leadNamespace.GET['One'];
  isMobile: boolean;
}

export function ChatList({
  messages,
  lead,
  isMobile
}: ChatScreenProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!lead) {
    return <div>Loading</div>
  }

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
      >
        <AnimatePresence>
          {messages?.items?.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: messages.items.indexOf(message) * 0.05 + 0.2,
                },
              }}
              style={{
                originX: 0.5,
                originY: 0.5,
              }}
              className={cn(
                "flex flex-col gap-2 p-4 whitespace-pre-wrap",
                message.from === 'lead' ? "items-end" : "items-start"
              )}
            >
              <div className="flex gap-3 items-center">
                <span className=" bg-accent p-3 rounded-md max-w-xs">
                  {message.text}
                </span>
                {message.from === 'lead' && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={lead.profilePic}
                      alt={lead.profilePic}
                      width={6}
                      height={6}
                    />
                  </Avatar>
                )}
                {message.from !== 'lead' && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={lead.instagram.profilePictureUrl}
                      alt={lead.instagram.firstname}
                      width={6}
                      height={6}
                    />
                  </Avatar>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ChatBottombar isMobile={isMobile}/>
    </div>
  );
}
