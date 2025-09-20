'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

export function QuantitySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <div className="flex items-center justify-start gap-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-12 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-4 w-24 mt-1" />
    </div>
  )
}

