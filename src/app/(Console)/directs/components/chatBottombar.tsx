import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import useCurrentLead from "@/store/currentLead.store";
import { WsMessageEvents } from "@/types/conversations/wsMessage.enum";
import { messagesSocket } from "@/utils/socket";
import { PaperPlaneRightIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { EmojiPicker } from "./emojiPicker";

export default function ChatBottombar() {
  const { currentLead } = useCurrentLead();

  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = useTranslations("Inbox.ChatBottombar");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSend = async () => {
    if (!currentLead) {
      return toast(t("errors.send"));
    }

    if (message.trim()) {
      const newMessage = {
        // instagramId: currentLead?.instagram.id,
        leadId: currentLead?.id,
        text: message.trim(),
      };
      const digest = Math.floor(Math.random()) * 10000 + Date.now();
      messagesSocket.emit(WsMessageEvents.SEND_MESSAGE, {
        ...newMessage,
        digest,
      });

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
      <div className="_wrapper flex w-full items-center">
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
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted shrink-0 dark:hover:text-white",
            )}
            onClick={handleSend}
          >
            <PaperPlaneRightIcon
              size={22}
              className="text-muted-foreground -rotate-[30deg]"
            />
          </Link>
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key="input"
            className="relative w-full"
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
              placeholder={t("textPlaceholder")}
              className="h-20 w-full resize-none rounded-md border-gray-200/60 focus-visible:border-gray-300"
            ></Textarea>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
