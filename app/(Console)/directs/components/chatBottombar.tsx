import Link from "next/link";
import React, { useRef, useState } from "react";
import { buttonVariants } from "@/components/theme/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "@/components/theme/ui/textarea";
import { EmojiPicker } from "./emojiPicker";
import useCurrentLead from "@/store/currentLead.store";
import { toast } from "@/components/ui/use-toast";
import { messagesSocket } from "@/app/utils/socket";
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { WsMessageEvents } from "@/types/conversations/wsMessage.enum";


export default function ChatBottombar() {
  const { currentLead } = useCurrentLead();

  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = useTranslations('Inbox.ChatBottombar');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSend = async () => {
    if (!currentLead) {
      return toast({
        variant: "destructive",
        title: t('errors.send'),
      });
    }

    if (message.trim()) {
      const newMessage = {
        // instagramId: currentLead?.instagram.id,
        leadId: currentLead?.id,
        text: message.trim(),
      };
      const digest = Math.floor(Math.random()) * 10000 + Date.now();
      messagesSocket.emit(WsMessageEvents.SEND_MESSAGE, { ...newMessage, digest });

      setMessage("");

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setMessage((prev) => prev + "\n");
    }
  };

  return (
    <div className="_bottom-bar mt-4">
      <div className="_wrapper w-full flex items-center">
        <div className="_emoji">
          <EmojiPicker
            onChange={(value) => {
              setMessage(message + value);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          />
        </div>
        <div className="_like ml-3">
          <Link
            href={"#"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            )}
            onClick={handleSend}
          >
            <PaperPlaneRight size={22} className="text-muted-foreground -rotate-[30deg]" />
          </Link>
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key="input"
            className="w-full relative"
            layout
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{
              opacity: { duration: 0.05 },
              layout: {
                type: "spring",
                bounce: 0.15,
              },
            }}
          >
            <Textarea
              autoComplete="off"
              value={message}
              ref={inputRef}
              onKeyDown={handleKeyPress}
              onChange={handleInputChange}
              name="message"
              placeholder={t('textPlaceholder')}
              className="w-full h-20 resize-none border-gray-200/60 rounded-md focus-visible:border-gray-300"
            ></Textarea>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
