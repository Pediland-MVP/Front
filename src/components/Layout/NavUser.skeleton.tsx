// src/components/layout/NavUser.skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export const NavUserSkeleton = () => {
  return (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[160px]" />
      </div>
    </div>
  )
}

