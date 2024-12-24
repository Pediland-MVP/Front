import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileFormSkeleton() {
  return (
    <Card className="h-full md:border-l-2 border-gray-100 p-6 md:p-10">
      <div className="flex flex-col gap-2">
        <div className="grid md:grid-cols-4 gap-2">
          {/* Gender field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Birth date field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* First name field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Last name field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Email field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Mobile field skeleton */}
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* State and City fields skeleton */}

        {/* Buttons skeleton */}
        <div className="grid grid-cols-2 gap-3 mt-10">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  );
}
