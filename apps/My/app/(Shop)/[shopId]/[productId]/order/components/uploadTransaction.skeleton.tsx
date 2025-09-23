import { Skeleton } from "@befroosh/ui"
import { cn } from "@befroosh/ui"

interface SkeletonButtonProps {
  className?: string
}

export function UploadTransactionSkeleton({ className }: SkeletonButtonProps) {
  return (
    <Skeleton
      className={cn(
        "h-10 w-full rounded-md bg-primary/20",
        className
      )}
    />
  )
}

