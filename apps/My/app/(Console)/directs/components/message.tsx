import { cn } from "@befroosh/lib/utils";
import { WsConversationMessage } from "@/types/conversations/conversation.ws";
import { leadNamespace } from "@/types/lead";
import { motion } from "framer-motion";


export type MessageProps = {
  message: WsConversationMessage;
  messagesList: WsConversationMessage[];
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
        "flex flex-col whitespace-pre-wrap",
        message.from === "lead" ? "items-end" : "items-start"
      )}
    >
      <div className={cn("text-sm p-2 rounded-md max-w-xs",
        message.from === "lead" ? "bg-gray-200" : "bg-primary text-white")}>
        {message.text}
      </div>
    </motion.div>
  );
}
