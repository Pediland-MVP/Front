import { cn, Avatar } from "@nextui-org/react";
import { AvatarImage } from "@radix-ui/react-avatar";
import { motion } from "framer-motion";
import { leadNamespace } from "@/types/lead";

export type SendingMessageType = { text: string; isLoading: boolean, digest: number };

export type SendingMessageProps = {
  message: SendingMessageType;
  lead: leadNamespace.Lead;
};

export default function SendingMessage({ message, lead }: SendingMessageProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
      transition={{
        opacity: { duration: 0.1 },
        layout: {
          type: "spring",
          bounce: 0.3,
        },
      }}
      style={{
        originX: 0.5,
        originY: 0.5,
      }}
      className={cn(
        "flex flex-col gap-2 p-4 whitespace-pre-wrap",
        "items-start",
        "animate-pulse"
      )}
    >
      <div className="flex gap-3 items-center">
        <span className=" bg-accent p-3 rounded-md max-w-xs">
          {message.text}
        </span>

        <Avatar className="flex justify-center items-center">
          <AvatarImage
            src={lead.instagram.profilePictureUrl}
            alt={lead.instagram.firstname}
            width={6}
            height={6}
          />
        </Avatar>
      </div>
    </motion.div>
  );
}
