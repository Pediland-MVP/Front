"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen } from "lucide-react";
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
import { InstagramNamespace } from '@/types/instagram';
import { memo, useEffect, useState } from "react";
import { socket } from "@/app/utils/socket";

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

  const [conversations, setConversations] = useState<InstagramNamespace.GET['Conversations']>()

  useEffect(() => {

    if (!socket.connected) return;
    
    socket.emit('conversations')

    socket.on('conversations', (conversations) => {
      setConversations(JSON.parse(conversations))
    })

    return () => {
      socket.off('conversations')
    }
  }, [])

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      {!isCollapsed && (
        <div className="flex justify-between p-2 items-center">
          <div className="flex gap-2 items-center text-2xl">
            <p className="font-medium">پیام‌ها</p>
            <span className="text-zinc-300">({links.length})</span>
          </div>

          <div>
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <MoreHorizontal size={20} />
            </Link>

            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <SquarePen size={20} />
            </Link>
          </div>
        </div>
      )}
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {conversations?.items?.map((chat, index) =>
          isCollapsed ? (
            <TooltipProvider key={index}>
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="#"
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: "icon" }),
                      "h-11 w-11 md:h-16 md:w-16",
                      // link.variant === "grey" &&
                      //   "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}
                  >
                    <Avatar className="flex justify-center items-center">
                      <AvatarImage
                        src={chat.profilePic}
                        alt={chat.firstname}
                        width={6}
                        height={6}
                        className="w-10 h-10 "
                      />
                    </Avatar>{" "}
                    <span className="sr-only">{chat.firstname} {chat.lastname && chat.lastname}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-4"
                >
                  {chat.firstname} {chat.lastname && chat.lastname}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              key={index}
              href={`/console/chats/${chat.id}`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: "lg" }),
                // link.variant === "grey" &&
                //   "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink",
                "justify-start gap-4 py-10"
              )}
            >
              <Image
                  src={chat.profilePic}
                  alt={chat.firstname}
                  width={60}
                  height={60}
                  className="rounded-full"
              />
              <div className="flex flex-col max-w-28">
                <span>{chat.firstname} {chat.lastname && chat.lastname}</span>
                {chat.messages && (
                  <span className="text-zinc-300 text-xs truncate ">
                    {chat.messages?.text}
                  </span>
                )}
              </div>
            </Link>
          )
        )}
      </nav>
    </div>
  );
}

export default memo(Sidebar)