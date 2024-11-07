"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import CommentSkeleton from "./comment.skeleton";
import CommentError from "./comment.error";
import CommentFooter from "./comment.footer";
import formatTimestamp from "@/lib/formatTimestamp";
import Reply from "./reply";
import { useEffect, useState } from "react";
import EE from "@/lib/ee";

interface ProfilePicture {
  url: string;
}

interface LeadInstagram {
  id: string;
  name: string;
  username: string;
  profilePicture?: ProfilePicture;
}

interface Instagram {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

export interface CommentReply {
  id: string;
  createDate: string;
  updateDate: string;
  text: string;
  mediaId: string;
  commentId: string;
  time: string;
  leadInstagram: LeadInstagram;
  instagram?: Instagram;
  fromAdmin: boolean;
}

interface Comment {
  id: string;
  createDate: string;
  updateDate: string;
  text: string;
  mediaId: string;
  commentId: string;
  time: string;
  replies: CommentReply[];
  leadInstagram: LeadInstagram;
}

export default function Component({ id }: { id: string }) {
  const [comment, setComment] = useState<Comment>();
  const {
    data,
    error,
    isLoading,
    mutate: mutateComments,
  } = useSWRImmutable<Comment>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/${id}?includeReplies=true`,
    fetcher
  );

  useEffect(() => {
    if (!isLoading && !error) {
      setComment(data);
    }
  }, [data]);

  useEffect(() => {
    EE.on("reply.sent", (reply: CommentReply) => {
      setComment((prevComment) => {
        if (prevComment) {
          return {
            ...prevComment,
            replies: [...prevComment.replies, reply],
          };
        }
        return prevComment;
      });
    });
  
    return () => {
      EE.off("reply.sent");
    };
  }, []);

  useEffect(() => {
    console.log(comment);
  }, [comment]);

  if (isLoading) return <CommentSkeleton />;
  if (error) return <CommentError />;
  if (!comment) return null;

  return (
    <div className="flex w-full min-h-screen bg-background">
      <Card className="flex-1 border-0 rounded-none">
        <CardHeader className="border-b">
          <h1 className="text-xl font-semibold">کامنت‌ها</h1>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-4">
              {/* Parent Comment */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={comment.leadInstagram?.profilePicture?.url}
                      alt={comment.leadInstagram?.username}
                    />
                    <AvatarFallback>
                      {comment.leadInstagram?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {comment.leadInstagram?.username}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(comment.time)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                </div>

                {/* Replies */}
                <div className="ml-12 space-y-4">
                  {comment.replies?.map((reply) => (
                    <Reply reply={reply} key={reply.id} />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>

        <CommentFooter commentId={id} mutateComments={mutateComments} />
      </Card>
    </div>
  );
}
