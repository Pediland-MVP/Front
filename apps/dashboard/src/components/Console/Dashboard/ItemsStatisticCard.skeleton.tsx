import { CardContent, CardFooter } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import { Skeleton } from '@/components/ui/skeleton';

export const ItemsStatisticCardSkeleton = () => {
  return (
    <CardSimple>
      <CardContent className="p-3 pb-2 md:py-4">
        <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
          <Skeleton className="size-6 rounded-full md:size-8" />
          <div className="mt-1 flex flex-col items-center justify-center gap-1.5">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center rounded-b-xl! bg-gray-50 p-1.5">
        <Skeleton className="h-3 w-10" />
      </CardFooter>
    </CardSimple>
  );
};
