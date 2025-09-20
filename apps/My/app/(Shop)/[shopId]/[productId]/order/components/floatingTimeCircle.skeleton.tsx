import { Card } from "@befroosh/ui"
import { Skeleton } from "@befroosh/ui"

export function FloatingTimeCircleSkeleton() {
  return (
    <Card className="fixed z-50 md:bottom-4 md:right-4 bottom-0 right-0 left-0 md:w-32 md:h-32 h-16 md:rounded-full rounded-none flex items-center justify-center bg-background shadow-lg">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Circular skeleton for desktop */}
        <div className="hidden md:block w-full h-full">
          <Skeleton className="w-full h-full rounded-full" />
        </div>
        {/* Linear skeleton and time display for mobile */}
        <div className="md:hidden w-full px-4 flex gap-x-3 items-center justify-center">
          <Skeleton className="h-6 w-14" /> {/* Time display skeleton */}
          <Skeleton className="h-2 flex-grow" /> {/* Progress bar skeleton */}
        </div>
        {/* Time display skeleton for desktop */}
        <div className="absolute top-0 left-0 w-full h-full md:flex hidden items-center justify-center">
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  )
}

