'use client'

import { memo, useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { commentsSocket } from "@/app/utils/socket"
import { CommentsNamespace } from "@/types/comment"
import { useParams } from "next/navigation"

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
  const page = useRef(1)
  const observer = useRef<IntersectionObserver | null>(null)
  const lastCommentElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchComments()
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore])

  const fetchComments = useCallback(() => {
    setTimeout(() => {
      setIsLoading(true)
      setError(null)
      commentsSocket.emit("comments", { 
        page: page.current,
        limit: 5
      })
    }, 2000)
  }, [])

  const handleComments = useCallback((commentsData: string) => {
    try {
      const newComments = JSON.parse(commentsData) as CommentsNamespace.GET
      setComments(prevComments => [...prevComments, ...newComments.items])
      setHasMore(newComments.items.length > 0)
      page.current += 1
    } catch (error) {
      setError('Error parsing comments data')
      console.error('Error handling comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewComment = useCallback((commentData: string) => {
    try {
      const newComment = JSON.parse(commentData) as CommentsNamespace.Comment
      setComments(prevComments => {
        if (prevComments.some(c => c.id === newComment.id)) {
          return prevComments
        }
        return [newComment, ...prevComments]
      })
    } catch (error) {
      console.error('Error handling new comment:', error)
    }
  }, [])

  useEffect(() => {
    commentsSocket.on("comments", handleComments)
    commentsSocket.on('comment.created', handleNewComment)
    fetchComments()

    return () => {
      commentsSocket.off("comments", handleComments)
      commentsSocket.off('comment.created', handleNewComment)
    }
  }, [handleComments, handleNewComment, fetchComments])

  return (
    <div className="relative w-full group flex flex-col h-screen bg-white rounded-xl">
      <div className="overflow-auto h-[calc(100vh-2rem)] p-2">
        <nav className={cn(
          "grid gap-1 px-2",
          isCollapsed && "group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
        )}>
          {comments.map((comment, index) => (
            <Link
              key={comment.id || index}
              href={`/console/comments/${comment.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "justify-start gap-4 pt-10 pb-8",
                comment.id === SelectedCommentId && 'bg-zinc-100'
              )}
              ref={index === comments.length - 1 ? lastCommentElementRef : null}
            >
              <Image
                src={comment.leadInstagram?.profilePicture.url || "/images/profile.png"}
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
          {isLoading && <div className="text-center py-4">درحال بارگزاری...</div>}
          {error && <div className="text-center py-4 text-red-500">{error}</div>}
          {!hasMore && <div className="text-center py-4">تموم شد :)</div>}
        </nav>
      </div>
    </div>
  )
}

export default memo(CommentsList)