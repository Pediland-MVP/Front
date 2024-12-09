import { leadNamespace } from "@/types/lead";
import { cn, Avatar } from "@nextui-org/react";
import { AvatarImage } from "@radix-ui/react-avatar";
import { motion } from "framer-motion";

export interface IMessage {
  from: "instagram" | "lead";
  text: string;
  id?: string;
  createDate?: Date;
  updateDate?: Date;
  messageId?: string;
  attachment?: null;
  sendDate?: string;
  digest?: number;
}

export type MessageProps = {
  message: IMessage;
  messagesList: IMessage[];
  lead: leadNamespace.Lead;
};
export default function Message({ message, messagesList, lead }: MessageProps) {
  return (
    <motion.div
      key={message.messageId}
      layout
      initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
      transition={{
        opacity: { duration: 0.1 },
        layout: {
          type: "spring",
          bounce: 0.3,
          duration: messagesList.indexOf(message) * 0.05 + 0.2,
        },
      }}
      style={{
        originX: 0.5,
        originY: 0.5,
      }}
      className={cn(
        "flex flex-col gap-2 px-4 py-2 whitespace-pre-wrap",
        message.from === "lead" ? "items-end" : "items-start"
      )}
    >
      <div className=" relative flex flex-ro gap-3 items-center">
        <span className={cn(message.from === "lead" ? "bg-accent" : "bg-blue-950 text-white","mr-14 p-2 rounded-md max-w-xs")}>
          {message.text}
        </span>
      </div>
    </motion.div>
  );
}
