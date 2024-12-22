'use client'

import { memo, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { commentsSocket } from "@/app/utils/socket"
import { CommentsNamespace } from "@/types/comment"
import { useParams } from "next/navigation"
import InfiniteScroll from "react-infinite-scroll-component"
import CommentsSkeleton from "./comments.skeleton"
import { useTranslations } from "next-intl"
import logger from "@/app/utils/logger"
import { Card } from "@/components/theme/ui/card"

function CommentsList() {
  const { id: SelectedCommentId } = useParams()

  const [comments, setComments] = useState<CommentsNamespace.Comments>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const t = useTranslations('Comments.List')

  const fetchComments = useCallback(() => {
    console.log("FetchMore", page)

    setIsLoading(true)
    setError(null)

    setPage((prevPage) => {
      const updatedPage = prevPage + 1;
      commentsSocket.emit("comments", {
        page: updatedPage,
        limit: 15,
      })
      return updatedPage
    })
  }, [page])

  const handleComments = useCallback((commentsData: string) => {
    try {
      const newComments = JSON.parse(commentsData) as CommentsNamespace.GET
      logger.debug(newComments)
      setComments((prevComments) => [...prevComments, ...newComments.items])
      setHasMore(newComments.items.length > 0)
    } catch (error) {
      setError("Error parsing comments data")
      console.error("Error handling comments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewComment = useCallback((commentData: string) => {
    try {
      const newComment = JSON.parse(commentData) as CommentsNamespace.Comment
      setComments((prevComments) => {
        if (prevComments.some((c) => c.id === newComment.id)) {
          return prevComments
        }
        return [newComment, ...prevComments]
      })
    } catch (error) {
      console.error("Error handling new comment:", error)
    }
  }, [])

  useEffect(() => {
    commentsSocket.on("comments", handleComments)
    commentsSocket.on("comment.created", handleNewComment)
    fetchComments()

    return () => {
      commentsSocket.off("comments", handleComments)
      commentsSocket.off("comment.created", handleNewComment)
    }
  }, [])

  useEffect(() => {
    console.log(page);

  }, [page])

  if (comments.length && isLoading) {
    return <CommentsSkeleton />
  }

  return (
    <Card className="border-l-2 border-gray-100 h-full">
      <div id="comments-container">
        <InfiniteScroll
          dataLength={comments.length}
          next={fetchComments}
          hasMore={hasMore}
          loader={<div className="text-center py-4">{t('loading')}</div>}
          endMessage={<div className="text-center py-4">{t('thereAreNoMoreComments')}</div>}
          scrollableTarget="comments-container"
        >
          <div className="w-full">
            {comments.map((comment, index) => (
              <Link
                key={comment.id || index}
                href={`/console/comments/${comment.id}`}
                className={cn(
                  "flex p-2 items-center gap-4 box-border rounded-lg hover:bg-accent duration-300 cursor-pointer",
                  comment.id === SelectedCommentId && "bg-zinc-100"
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
                  <span className="font-medium">{comment.leadInstagram?.name}</span>
                  <span className="text-muted-foreground text-xs truncate">
                    {comment.text}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </InfiniteScroll>
        {error && <div className="text-center py-4 text-red-500">{error}</div>}
      </div>
    </Card>
  )
}

export default memo(CommentsList)