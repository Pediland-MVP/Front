import { Avatar, AvatarImage, AvatarFallback } from "@befroosh/ui";
import formatTimestamp from "@/utils/formatTimestamp";
import { CommentNamespace } from "@/types/comments/comment.namespace";

export default function AdminReply({
  reply,
}: {
  reply: CommentNamespace.GET.Comment["replies"][0];
}) {
  return (
    <div className="flex justify-end items-center gap-x-2 my-2 mb-4">
      <div className="flex flex-col items-end">
        <div className="flex flex-co items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatTimestamp(reply.time)}
          </span>
          <span className="font-semibold">{reply.instagram?.username}</span>
        </div>
        <p className="text-sm">{reply.text}</p>
      </div>
      <Avatar className="w-10 h-10">
        <AvatarImage
          src={reply.instagram?.profilePicture?.url}
          alt={reply.instagram?.username}
        />
        <AvatarFallback>{reply.instagram?.username[0]}</AvatarFallback>
      </Avatar>
    </div>
  );
}
