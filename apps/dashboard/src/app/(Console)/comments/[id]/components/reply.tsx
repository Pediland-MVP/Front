import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import formatTimestamp from "@/utils/formatTimestamp";
import AdminReply from "./adminReply";
import { CommentNamespace } from "@/types/comments/comment.namespace";

export default function Reply({ reply }: { reply: CommentNamespace.GET.Comment['replies'][0] }) {
  if (reply.fromAdmin) {
    return <AdminReply reply={reply} />;
  }

  return (
    <div key={reply.id} className="flex items-end gap-3 my-2">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{reply.leadInstagram?.username}</span>
          <span className="text-sm text-muted-foreground">
            {formatTimestamp(reply.time)}
          </span>
        </div>
        <p className="text-sm">{reply.text}</p>
      </div>
      <Avatar className="w-10 h-10">
        <AvatarImage
          src={reply.leadInstagram?.profilePicture?.url}
          alt={reply.leadInstagram?.username}
        />
        <AvatarFallback>{reply.leadInstagram?.username[0]}</AvatarFallback>
      </Avatar>
    </div>

    
  );
}
