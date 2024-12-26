"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/theme/ui/card";
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
import { AnimatePresence, motion } from 'framer-motion';
import { CommentNamespace } from "@/types/comments/comment.namespace";
import CommentTopBar from "./commentTopBar";


export default function Component({ id }: { id: string }) {
  const [comment, setComment] = useState<CommentNamespace.GET.Comment>();
  const [lastReplyId, setLastReplyId] = useState<string>()
  const {
    data,
    error,
    isLoading,
    mutate: mutateComments,
  } = useSWR<CommentNamespace.GET.Comment>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/${id}?includeReplies=true`,
    fetcher,
  );

  useEffect(() => {
    if (!isLoading && !error) {
      if (lastReplyId) {
        const isHaveLastReply = data?.replies?.some((reply) => reply.commentId === lastReplyId)
        if (isHaveLastReply) {
          setLastReplyId(undefined)
          setComment(data)
        }
        return
      }
      setComment(data);
    }
  }, [data]);

  const addReply = (replyData: any) => {
    setComment((comment) => {
      if (comment) {
        setLastReplyId(replyData.commentId)
        return ({
          ...comment,
          replies: [replyData, ...comment.replies],
        } as unknown as CommentNamespace.GET.Comment)
      }
    })
  }


  const t = useTranslations('Comments.Comment');

  if (isLoading) return <CommentSkeleton />;
  if (error) return <CommentError />;
  if (!comment) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="w-full md:w-2/3 bg-white h-full border-l-2 border-gray-100"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        {/* <div className="w-full md:w-2/3 h-full"> */}
          {/* <div className="w-full md:w-2/3 bg-white h-full border-l-2 border-gray-100"> */}
            <Card className="flex flex-col w-full lg:p-5 lg:pb-5 pb-20">
              <div className="w-full flex flex-col h-svh lg:max-h-[calc(100vh-138px)]">
                <CommentTopBar instagramPost={comment.instagramPost} />
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
                      <div className="ml-12 space-y-4 ">
                        {comment.replies?.map((reply) => (
                          <Reply reply={reply} key={reply.id} />
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <CommentFooter commentId={id} addReply={addReply} />
            </Card>
          {/* </div> */}
        {/* </div> */}
      </motion.div>
    </AnimatePresence>
  );
}
