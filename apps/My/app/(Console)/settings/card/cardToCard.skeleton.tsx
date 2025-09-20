import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CardToCardSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-1/4" />
            </CardTitle>
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <div className="w-full relative">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-8 absolute top-1/2 transform -translate-y-1/2 left-2" />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}