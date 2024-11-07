'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Smile, Send } from "lucide-react"
import { useState } from "react"
import useSWR from 'swr'
import { fetcher } from '@/hooks/swr/fetcher'
import CommentSkeleton from './comment.skeleton'
import CommentError from './comment.error'

interface ProfilePicture {
  url: string
}

interface LeadInstagram {
  id: string
  name: string
  username: string
  profilePicture?: ProfilePicture
}

interface CommentReply {
  id: string
  createDate: string
  updateDate: string
  text: string
  mediaId: string
  commentId: string
  time: string
  leadInstagram: LeadInstagram
}

interface Comment {
  id: string
  createDate: string
  updateDate: string
  text: string
  mediaId: string
  commentId: string
  time: string
  replies: CommentReply[]
  leadInstagram: LeadInstagram
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 24) {
    return `${hours}h`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}d`
  }
}

export default function Component({id}: {id: string}) {
  const [replyText, setReplyText] = useState("")
  const { data: comment, error, isLoading } = useSWR<Comment>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/comments/${id}?includeReplies=true`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle reply submission
    setReplyText("")
  }

  if (isLoading) return <CommentSkeleton />
  if (error) return <CommentError />
  if (!comment) return null

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
                    <AvatarImage src={comment.leadInstagram?.profilePicture?.url} alt={comment.leadInstagram.username} />
                    <AvatarFallback>{comment.leadInstagram.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.leadInstagram.username}</span>
                      <span className="text-sm text-muted-foreground">{formatTimestamp(comment.time)}</span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                </div>

                {/* Replies */}
                <div className="ml-12 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={reply.leadInstagram?.profilePicture?.url} alt={reply.leadInstagram.username} />
                        <AvatarFallback>{reply.leadInstagram.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{reply.leadInstagram.username}</span>
                          <span className="text-sm text-muted-foreground">{formatTimestamp(reply.time)}</span>
                        </div>
                        <p className="text-sm">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmitReply} className="flex w-full gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Add a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}