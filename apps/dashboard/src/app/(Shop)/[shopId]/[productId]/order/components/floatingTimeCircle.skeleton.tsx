import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FloatingTimeCircleSkeleton() {
  return (
    <Card className="bg-background fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-center rounded-none shadow-lg md:right-4 md:bottom-4 md:h-32 md:w-32 md:rounded-full">
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Circular skeleton for desktop */}
        <div className="hidden h-full w-full md:block">
          <Skeleton className="h-full w-full rounded-full" />
        </div>
        {/* Linear skeleton and time display for mobile */}
        <div className="flex w-full items-center justify-center gap-x-3 px-4 md:hidden">
          <Skeleton className="h-6 w-14" /> {/* Time display skeleton */}
          <Skeleton className="h-2 flex-grow" /> {/* Progress bar skeleton */}
        </div>
        {/* Time display skeleton for desktop */}
        <div className="absolute top-0 left-0 hidden h-full w-full items-center justify-center md:flex">
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  );
}
