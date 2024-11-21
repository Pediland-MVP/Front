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

interface CommentsListProps {
  isCollapsed: boolean
  onClick?: () => void
  isMobile: boolean
}

function CommentsList({ isCollapsed, onClick, isMobile }: CommentsListProps) {
  const { id: SelectedCommentId } = useParams()

  const [comments, setComments] = useState<CommentsNamespace.Comments>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

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
    return <CommentsSkeleton/>
  }

  return (
    <div className="relative w-full group flex flex-col h-screen bg-white rounded-xl">
      <div
        id="comments-container"
        className="overflow-y-auto h-[calc(100vh-2rem)] p-2  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors duration-200"
      >
        <InfiniteScroll
          dataLength={comments.length}
          next={fetchComments}
          hasMore={hasMore}
          loader={<div className="text-center py-4">{t('loading')}</div>}
          endMessage={<div className="text-center py-4">{t('thereAreNoMoreComments')}</div>}
          scrollableTarget="comments-container"
        >
          <div className="grid gap-1 px-2">
            {comments.map((comment, index) => (
              <Link
                key={comment.id || index}
                href={`/console/comments/${comment.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "justify-start gap-4 pt-10 pb-8",
                  comment.id === SelectedCommentId && "bg-zinc-100"
                )}
              >
                <Image
                  src={
                    comment.leadInstagram?.profilePicture.url ||
                    "/images/profile.png"
                  }
                  alt={comment.leadInstagram?.name}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div className="flex flex-col max-w-28">
                  <span>{comment.leadInstagram?.name}</span>
                  <span className="text-zinc-300 text-xs truncate">
                    {comment.text}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </InfiniteScroll>
        {error && <div className="text-center py-4 text-red-500">{error}</div>}
      </div>
    </div>
  )
}

export default memo(CommentsList)