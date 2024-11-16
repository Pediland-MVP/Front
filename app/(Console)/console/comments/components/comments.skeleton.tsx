'use client'

import { memo } from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatsListSkeletonProps {
  isCollapsed: boolean
  isMobile: boolean
}

function ChatsListSkeleton() {
  return (
    <div
      className="relative w-full group flex flex-col max-h-[97vh] min-h-[97vh] bg-white rounded-xl"
    >
      <div
        id="chats-container"
        className="overflow-y-auto h-[calc(97vh-2rem)] p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-colors duration-200"
      >
        <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "justify-start gap-4 pt-10 pb-8"
              )}
            >
              <Skeleton className="w-[60px] h-[60px] rounded-full" />
              <div className="flex flex-col max-w-28 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default memo(ChatsListSkeleton)