import { Skeleton } from '@/components/ui/skeleton';

export function ProductDetailsSkeleton() {
  return (
    <div className="md:col-span-4">
      <div className="flex flex-col items-start gap-4 md:flex-row md:gap-6">
        <div className="relative aspect-square w-full md:w-1/3">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>

        <div className="flex h-full w-full items-center md:w-2/3">
          <div className="flex w-full flex-col gap-5">
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
  );
}
