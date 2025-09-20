import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ZarinpalSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <div className="mb-6">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="mt-6">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

