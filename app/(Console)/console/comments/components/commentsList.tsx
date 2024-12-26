"use client";

import { memo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { commentsSocket } from "@/app/utils/socket";
import { useParams, useRouter } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import CommentsSkeleton from "./comments.skeleton";
import { useTranslations } from "next-intl";
import { Card } from "@/components/theme/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/components/theme/ui/sidebar";
import { ArrowLeft, Sidebar } from "@phosphor-icons/react/dist/ssr";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { useComments } from "../context/comments.context";
import { CommentNamespace } from "@/types/comments/comment.namespace";

interface CommentsListProps {
  children?: React.ReactNode;
}

function CommentsList({ children }: CommentsListProps) {
  const router = useRouter();
  const { id: selectedCommentId } = useParams();
  const { comments, setComments } = useComments();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 15;

  const sidebar = useSidebar();
  const t = useTranslations("Comments.List");

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );

  const fetchComments = useCallback(() => {
    setIsLoading(true);
    setError(null);

    setPage((prevPage) => {
      const updatedPage = prevPage + 1;
      commentsSocket.emit("comments", {
        page: updatedPage,
        limit: LIMIT,
      });
      return updatedPage;
    });
  }, []);

  const handleComments = useCallback((commentsData: string) => {
    try {
      const newComments = JSON.parse(
        commentsData
      ) as CommentNamespace.WS.Comments;
      setComments((prevComments) => [...prevComments, ...newComments.items]);
      setHasMore(newComments.items.length === LIMIT);
    } catch (error) {
      setError("Error parsing comments data");
      console.error("Error handling comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    commentsSocket.on("comments", handleComments);
    fetchComments();

    return () => {
      commentsSocket.off("comments", handleComments);
    };
  }, []);

  const isCommentsListHidden =
    (isSmallDevice || isMediumDevice) && selectedCommentId;

  if (!comments.length && isLoading) {
    return <CommentsSkeleton />;
  }

  if (!comments.length) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p>{t("noComments")}</p>
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
          className="lg:w-1/3 w-full h-full bg-white"
        >
          <Card className="w-full h-full p-4 box-border overflow-hidden flex flex-col border-l-2 border-gray-100">
            <div className="w-full flex lg:hidden justify-between mb-4">
              <Sidebar
                onClick={() => sidebar.setOpenMobile(true)}
                className="text-muted-foreground"
                height={30}
                width={30}
              />
              <ArrowLeft
                onClick={() => router.push("/console")}
                className="text-muted-foreground"
                height={30}
                width={30}
              />
            </div>
            <div
              id="chats-container"
              className="flex-grow overflow-y-auto w-full"
            >
              <InfiniteScroll
                dataLength={comments.length}
                next={fetchComments}
                hasMore={hasMore}
                loader={
                  <div className="w-full flex justify-center items-center text-center py-4">
                    <LoadingSpinner />
                  </div>
                }
                scrollableTarget="chats-container"
                className="overflow-hidden"
              >
                <div className="w-full">
                  {comments.map((comment, index) => (
                    <Link
                      key={comment.id || index}
                      href={`/console/comments/${comment.id}`}
                      className={cn(
                        "flex p-2 items-center gap-4 box-border rounded-lg hover:bg-accent duration-300 cursor-pointer",
                        comment.id === selectedCommentId && "bg-zinc-100"
                      )}
                    >
                      <Image
                        src={
                          comment.leadInstagram?.profilePicture.url ||
                          "/images/profile.png"
                        }
                        alt={comment.leadInstagram?.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium">
                          {comment.leadInstagram?.name}
                        </span>
                        <span className="text-muted-foreground text-xs truncate">
                          {comment.text}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </InfiniteScroll>
              {error && (
                <div className="text-center py-4 text-destructive">{error}</div>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(CommentsList);
