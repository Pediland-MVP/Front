"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import formatTimestamp from "@/lib/formatTimestamp";
import Reply from "./reply";
import { CommentNamespace } from "@/types/comments/comment.namespace";

type CommentMessagesProps = {
  comment: CommentNamespace.GET.Comment;
};

export default function CommentMessages({ comment }: CommentMessagesProps) {
  return (
    <div className="w-full overflow-y-auto overflow-x-hidden flex flex-col _wrap bg-slate-50 h-full">
      <div className="flex flex-col gap-1.5 p-3">
        {/* Parent Comment */}

        {/* <div className="flex items-start gap-3"> */}

        <div className="flex justify-end items-center gap-x-2 my-2 mb-4">
            <div className="flex flex-col items-end">
                <div className="flex flex-co items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                    {formatTimestamp(comment.time)}
                    </span>
                    <span className="font-semibold">
                    {comment.leadInstagram?.username}
                    </span>
                </div>
                <p className="text-sm">{comment.text}</p>
            </div>
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={comment.leadInstagram?.profilePicture?.url}
              alt={comment.leadInstagram?.username}
            />
            <AvatarFallback>
              {comment.leadInstagram?.username[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* </div> */}

        {/* Replies */}
        <div className="flex flex-col items-end my-3 ml-12">
          {comment.replies?.map((reply) => (
            <Reply reply={reply} key={reply.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
