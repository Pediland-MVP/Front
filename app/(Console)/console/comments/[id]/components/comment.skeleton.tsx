'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Smile, Send } from "lucide-react"

export default function CommentSkeleton() {
  return (
    <div className="flex w-full min-h-screen bg-background">
      <Card className="flex-1 border-0 rounded-none">
        <CardHeader className="border-b">
          <h1 className="text-xl font-semibold">کامنت‌ها</h1>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-4 space-y-4">
              {/* Parent Comment Skeleton */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>

                {/* Replies Skeleton */}
                <div className="ml-12 space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form className="flex w-full gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="shrink-0"
              disabled
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Add a reply..."
              disabled
              className="flex-1"
            />
            <Button type="submit" size="icon" className="shrink-0" disabled>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}