import { Skeleton } from "@befroosh/ui"

export function ProductDetailsSkeleton() {
  return (
    <div className="md:col-span-4">
      <div className="flex flex-col gap-4 md:flex-row items-start md:gap-6">
        <div className="relative w-full md:w-1/3 aspect-square">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>

        <div className="md:w-2/3 flex items-center h-full w-full">
          <div className="flex flex-col gap-5 w-full">
            <Skeleton className="h-8 w-3/4" /> {/* Title */}
            <Skeleton className="h-20 w-full" /> {/* Description */}
            <Skeleton className="h-6 w-1/4" /> {/* Stock */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" /> {/* Price label */}
              <Skeleton className="h-6 w-24" /> {/* Price value */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

