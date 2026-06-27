import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import formatTimestamp from '@/utils/formatTimestamp';
import { CommentNamespace } from '@/types/comments/comment.namespace';

export default function AdminReply({
  reply,
}: {
  reply: CommentNamespace.GET.Comment['replies'][0];
}) {
  return (
    <div className="my-2 mb-4 flex items-center justify-end gap-x-2">
      <div className="flex flex-col items-end">
        <div className="flex-co flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{formatTimestamp(reply.time)}</span>
          <span className="font-semibold">{reply.instagram?.username}</span>
        </div>
        <p className="text-sm">{reply.text}</p>
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage src={reply.instagram?.profilePicture?.url} alt={reply.instagram?.username} />
        <AvatarFallback>{reply.instagram?.username[0]}</AvatarFallback>
      </Avatar>
    </div>
  );
}
