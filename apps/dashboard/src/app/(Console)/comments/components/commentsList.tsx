'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { commentsSocket } from '@/utils/socket';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSidebar } from '@/components/ui/sidebar';
import { ArrowLeft, Sidebar } from '@phosphor-icons/react/dist/ssr';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { useComments } from '../context/comments.context';
import { CommentNamespace } from '@/types/comments/comment.namespace';
import CommentsListSkeleton from './commentsList.skeleton';
import logger from '@/utils/logger';
import InfiniteScroll from '@/components/ui/infinite-scroll';

interface CommentsListProps {
  children?: React.ReactNode;
}

const LIMIT = 15;
function CommentsList({ children }: CommentsListProps) {
  const router = useRouter();
  const { id: selectedCommentId } = useParams();
  const { comments, setComments } = useComments();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const sidebar = useSidebar();
  const t = useTranslations('Comments.List');

  const fetchComments = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setPage((prevPage) => {
      const updatedPage = prevPage + 1;
      logger.debug(`Get new comments page: ${updatedPage}, limit: ${LIMIT}`);
      commentsSocket.emit('comments', {
        page: updatedPage,
        limit: LIMIT,
      });
      return updatedPage;
    });
  }, []);

  const handleComments = useCallback((commentsData: string) => {
    try {
      const newComments = JSON.parse(commentsData) as CommentNamespace.WS.Comments;
      setComments((prevComments) => [...prevComments, ...newComments.items]);
      setHasMore(newComments.items.length === LIMIT);
    } catch (error) {
      setError('Error parsing comments data');
      console.error('Error handling comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    commentsSocket.on('comments', handleComments);
    if (!comments.length) {
      fetchComments();
    }

    return () => {
      commentsSocket.off('comments', handleComments);
    };
  }, []);

  const isSmallDevice = useMediaQuery('only screen and (max-width : 768px)');
  const isMediumDevice = useMediaQuery(
    'only screen and (min-width : 769px) and (max-width : 992px)',
  );

  const isCommentsListHidden = (isSmallDevice || isMediumDevice) && selectedCommentId;

  if (!comments.length && isLoading) {
    return <CommentsListSkeleton />;
  }

  if (!comments.length) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>{t('noComments')}</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isCommentsListHidden && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full bg-white lg:w-1/3"
        >
          <Card className="box-border flex h-full w-full flex-col overflow-hidden rounded-none border-l-2 border-gray-100 p-4">
            <div
              id="comments-container"
              className="_wrap max-h-[calc(100vh - 900px)] min-h-[600px] w-full overflow-y-auto"
            >
              <div className="flex w-full flex-col">
                {comments.map((comment, index) => (
                  <Link
                    key={comment.id || index}
                    href={`/comments/${comment.id}`}
                    className={cn(
                      'hover:bg-accent box-border flex cursor-pointer items-center gap-4 rounded-lg p-2 duration-300',
                      comment.id === selectedCommentId && 'bg-zinc-100',
                    )}
                  >
                    <Image
                      src={comment.leadInstagram?.profilePicture?.url || '/images/profile.png'}
                      alt={comment.leadInstagram?.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium">{comment.leadInstagram?.name}</span>
                      <span className="text-muted-foreground truncate text-xs">{comment.text}</span>
                    </div>
                  </Link>
                ))}
                <InfiniteScroll
                  threshold={1}
                  isLoading={isLoading}
                  next={fetchComments}
                  hasMore={hasMore}
                >
                  {hasMore && (
                    <div className="flex w-full items-center justify-center py-4 text-center">
                      <LoaderSpin />
                    </div>
                  )}
                </InfiniteScroll>
              </div>
              {/* <div className="w-full"> */}
              {error && <div className="text-destructive py-4 text-center">{error}</div>}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(CommentsList);
