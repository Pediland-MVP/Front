"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { InstagramNamespace } from "@/types/instagram";
import { memo, useEffect, useState } from "react";
import { messagesSocket } from "@/app/utils/socket";

interface SidebarProps {
  isCollapsed: boolean;
  onClick?: () => void;
  isMobile: boolean;
}

function ChatsList({ isCollapsed, isMobile }: SidebarProps) {
  const [conversations, setConversations] =
    useState<InstagramNamespace.GET["Conversations"]>();

  useEffect(() => {
    if (!messagesSocket.connected) {
      messagesSocket.connect();
    }

    messagesSocket.emit("conversations");

    messagesSocket.on("conversations", (conversations) => {
      setConversations(JSON.parse(conversations));
    });

    return () => {
      messagesSocket.off("conversations");
    };
  }, []);

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative w-full group flex flex-col max-h-[97vh] min-h-[97vh] gap-4 p-2 data-[collapsed=true]:p-2 bg-white rounded-xl"
    >
      
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {conversations?.items?.map((chat, index) => (
              <Link
              key={index}
              href={`/console/inbox/${chat.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                // link.variant === "grey" &&
                //   "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink",
                "justify-start gap-4 pt-10 pb-8"
              )}
            >
              {
                chat.leadInstagram?.profilePicture?.url ? (
                  <Image
                    src={chat.leadInstagram?.profilePicture?.url}
                    alt={chat.firstname}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                ) : (
                  <Image
                  src={'/images/profile.png'}
                  alt={chat.firstname}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                )
              }
              <div className="flex flex-col max-w-28">
                <span>
                  {chat.firstname} {chat.lastname && chat.lastname}
                </span>
                {chat.messages && (
                  <span className="text-zinc-300 text-xs truncate ">
                    {chat.messages?.text}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>
    </div>
  );
}

export default memo(ChatsList);
