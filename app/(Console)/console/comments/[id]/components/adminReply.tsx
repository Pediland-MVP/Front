import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentReply } from "./comment";
import formatTimestamp from "@/lib/formatTimestamp";

export default function AdminReply({ reply }: { reply: CommentReply }) {
  return (
    <div key={reply.id} className="flex items-start gap-3">
      <Avatar className="w-10 h-10">
        <AvatarImage
          src={reply.instagram?.profilePicture?.url || ''}
          alt={reply.instagram?.username}
        />
        <AvatarFallback>{reply.instagram?.username[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{reply.instagram?.username}</span>
          <span className="text-sm text-muted-foreground">
            {formatTimestamp(reply.time)}
          </span>
        </div>
        <p className="text-sm">{reply.text}</p>
      </div>
    </div>
  );
}
