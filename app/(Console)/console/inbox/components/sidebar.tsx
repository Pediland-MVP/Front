"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Message } from "./data";
import Image from "next/image";
import { InstagramNamespace } from "@/types/instagram";
import { memo, useEffect, useState } from "react";
import { socket } from "@/app/utils/socket";
import { SideBarTab } from "./sideBarTap";
import { useTabStore } from "@/store/tabActiveStore";

interface SidebarProps {
  isCollapsed: boolean;
  links: {
    name: string;
    messages: Message[];
    avatar: string;
    variant: any;
  }[];
  onClick?: () => void;
  isMobile: boolean;
}

function Sidebar({ links, isCollapsed, isMobile }: SidebarProps) {
  const { activeTab } = useTabStore();
  const [conversations, setConversations] =
    useState<InstagramNamespace.GET["Conversations"]>();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("conversations");

    socket.on("conversations", (conversations) => {
      setConversations(JSON.parse(conversations));
    });

    return () => {
      socket.off("conversations");
    };
  }, []);
  console.log(activeTab);

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative w-full group flex flex-col max-h-[97vh] min-h-[97vh] gap-4 p-2 data-[collapsed=true]:p-2 bg-white rounded-xl"
    >
      {!isCollapsed && (
        <div className="flex justify-between p-2 items-center">
          <div className="flex w-full gap-2 items-center text-2xl  pb-2">
            <SideBarTab />
          </div>
        </div>
      )}
      {activeTab === "chat" && (
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
              <Image
                src={chat.leadInstagram?.profilePicture?.url}
                alt={chat.firstname}
                width={60}
                height={60}
                className="rounded-full"
              />
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
      )}
    </div>
  );
}

export default memo(Sidebar);
