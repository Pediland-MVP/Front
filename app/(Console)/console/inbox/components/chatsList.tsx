'use client'

import { memo, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { messagesSocket } from "@/app/utils/socket"
import { InstagramNamespace, Conversations, Item } from "@/types/instagram"
import InfiniteScroll from "react-infinite-scroll-component"

interface ChatsListProps {
  isCollapsed: boolean
  onClick?: () => void
  isMobile: boolean
}

function ChatsList({ isCollapsed, isMobile }: ChatsListProps) {
  const [conversations, setConversations] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 15

  const fetchConversations = useCallback(() => {
    setIsLoading(true)
    setError(null)

    setPage((prevPage) => {
      const updatedPage = prevPage + 1
      messagesSocket.emit("conversations", {
        page: updatedPage,
        limit,
      })
      return updatedPage
    })
  }, [page])

  const handleConversations = useCallback((conversationsData: string) => {
    try {
      const newConversations = JSON.parse(conversationsData) as Conversations
      setConversations((prevConversations) => [...prevConversations, ...newConversations.items])
      setHasMore(newConversations.items.length === limit)
    } catch (error) {
      setError("Error parsing conversations data")
      console.error("Error handling conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewConversation = useCallback((conversationData: string) => {
    try {
      const newConversation = JSON.parse(conversationData) as Item
      setConversations((prevConversations) => {
        if (prevConversations.some((c) => c.id === newConversation.id)) {
          return prevConversations
        }
        return [newConversation, ...prevConversations]
      })
    } catch (error) {
      console.error("Error handling new conversation:", error)
    }
  }, [])

  useEffect(() => {
    if (!messagesSocket.connected) {
      messagesSocket.connect()
    }

    messagesSocket.on("conversations", handleConversations)
    messagesSocket.on("conversation.created", handleNewConversation)
    fetchConversations()

    return () => {
      messagesSocket.off("conversations", handleConversations)
      messagesSocket.off("conversation.created", handleNewConversation)
    }
  }, [])

  if (!conversations.length && isLoading) {
    return <div>Loading</div>
  }

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative w-full group flex flex-col max-h-[97vh] min-h-[97vh] bg-white rounded-xl"
    >
      <div
        id="chats-container"
        className="overflow-y-auto h-[calc(97vh-2rem)] p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors duration-200"
      >
        <InfiniteScroll
          dataLength={conversations.length}
          next={fetchConversations}
          hasMore={hasMore}
          loader={<div className="text-center py-4">درحال بارگزاری...</div>}
          endMessage={<div className="text-center py-4">تموم شد :)</div>}
          scrollableTarget="chats-container"
        >
          <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
            {conversations.map((chat, index) => (
              <Link
                key={chat.id || index}
                href={`/console/inbox/${chat.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "justify-start gap-4 pt-10 pb-8"
                )}
              >
                <Image
                  src={chat.leadInstagram?.profilePicture?.url || '/images/profile.png'}
                  alt={chat.firstname}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div className="flex flex-col max-w-28">
                  <span>
                    {chat.firstname} {chat.lastname || ''}
                  </span>
                  {chat.messages && (
                    <span className="text-zinc-300 text-xs truncate">
                      {chat.messages.text}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>
        </InfiniteScroll>
        {error && <div className="text-center py-4 text-red-500">{error}</div>}
      </div>
    </div>
  )
}

export default memo(ChatsList)