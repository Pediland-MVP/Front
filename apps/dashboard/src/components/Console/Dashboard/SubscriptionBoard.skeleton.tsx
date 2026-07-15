import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import { Skeleton } from '@/components/ui/skeleton';

export const SubscriptionBoardSkeleton = () => {
  return (
    <CardSimple>
      <CardContent className="p-3 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
          <div className="flex w-full items-center gap-3 md:gap-5">
            <Skeleton className="size-[85px] shrink-0 rounded-full md:size-[95px]" />
            <div className="flex-1 text-sm">
              <Skeleton className="mb-1.5 h-4 w-40" />
              <Skeleton className="mb-1 h-4 w-32" />
              <Skeleton className="mb-1 h-4 w-36" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
          <div className="w-full md:w-40">
            <Skeleton className="h-9 w-full md:h-10" />
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
