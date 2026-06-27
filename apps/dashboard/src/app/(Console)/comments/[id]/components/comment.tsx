'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetcher } from '@/hooks/swr/fetcher';
import CommentSkeleton from './comment.skeleton';
import CommentError from './comment.error';
import CommentFooter from './comment.footer';
import formatTimestamp from '@/utils/formatTimestamp';
import Reply from './reply';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { CommentNamespace } from '@/types/comments/comment.namespace';
import CommentTopBar from './commentTopBar';
import CommentMessages from './commentMessages';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function Component({ id }: { id: string }) {
  const [comment, setComment] = useState<CommentNamespace.GET.Comment>();
  const [lastReplyId, setLastReplyId] = useState<string>();
  const {
    data,
    error,
    isLoading,
    mutate: mutateComments,
  } = useSWR<CommentNamespace.GET.Comment>(`${API_URL}/comments/${id}?includeReplies=true`);

  useEffect(() => {
    if (!isLoading && !error) {
      if (lastReplyId) {
        const isHaveLastReply = data?.replies?.some((reply) => reply.commentId === lastReplyId);
        if (isHaveLastReply) {
          setLastReplyId(undefined);
          setComment(data);
        }
        return;
      }
      setComment(data);
    }
  }, [data]);

  const addReply = (replyData: any) => {
    setComment((comment) => {
      if (comment) {
        setLastReplyId(replyData.commentId);
        return {
          ...comment,
          replies: [replyData, ...comment.replies],
        } as unknown as CommentNamespace.GET.Comment;
      }
    });
  };

  const t = useTranslations('Comments.Comment');

  // if (isLoading) return <CommentSkeleton />;
  if (error) return <CommentError />;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="h-full w-full border-l-2 border-gray-100 bg-white md:w-2/3"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading || !comment ? (
          <CommentSkeleton />
        ) : (
          <Card className="flex h-full w-full p-5">
            <div className="flex h-svh w-full flex-col lg:max-h-[calc(100vh-138px)]">
              <CommentTopBar instagramPost={comment.instagramPost} />
              <CommentMessages comment={comment} />
              <CommentFooter commentId={id} addReply={addReply} />
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
