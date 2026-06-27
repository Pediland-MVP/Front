'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import formatTimestamp from '@/utils/formatTimestamp';
import Reply from './reply';
import { CommentNamespace } from '@/types/comments/comment.namespace';

type CommentMessagesProps = {
  comment: CommentNamespace.GET.Comment;
};

export default function CommentMessages({ comment }: CommentMessagesProps) {
  return (
    <div className="_wrap flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-slate-50">
      <div className="flex flex-col gap-1.5 p-3">
        {/* Parent Comment */}

        {/* <div className="flex items-start gap-3"> */}

        <div className="my-2 mb-4 flex items-center justify-end gap-x-2">
          <div className="flex flex-col items-end">
            <div className="flex-co flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{formatTimestamp(comment.time)}</span>
              <span className="font-semibold">{comment.leadInstagram?.username}</span>
            </div>
            <p className="text-sm">{comment.text}</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={comment.leadInstagram?.profilePicture?.url}
              alt={comment.leadInstagram?.username}
            />
            <AvatarFallback>{comment.leadInstagram?.username[0]}</AvatarFallback>
          </Avatar>
        </div>

        {/* </div> */}

        {/* Replies */}
        <div className="my-3 ml-12 flex flex-col items-end">
          {comment.replies?.map((reply) => (
            <Reply reply={reply} key={reply.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
