"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/theme/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetcher } from "@/hooks/swr/fetcher";
import CommentSkeleton from "./comment.skeleton";
import CommentError from "./comment.error";
import CommentFooter from "./comment.footer";
import formatTimestamp from "@/lib/formatTimestamp";
import Reply from "./reply";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";

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
  } = useSWR<Comment>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/${id}?includeReplies=true`,
    fetcher
  );

  useEffect(() => {
    if (!isLoading && !error) {
      setComment(data);
    }
  }, [data]);


  const t = useTranslations('Comments.Comment');

  if (isLoading) return <CommentSkeleton />;
  if (error) return <CommentError />;
  if (!comment) return null;

  return (
    <div className="w-full md:w-2/3 h-full">
      <div className="w-full md:w-2/3 bg-white h-full border-l-2 border-gray-100">
        <Card className="flex flex-col w-full h-full p-5">
          <CardContent className="p-0">
            <ScrollArea className="h-full">
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
    </div>
  );
}
