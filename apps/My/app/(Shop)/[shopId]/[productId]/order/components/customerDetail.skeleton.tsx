import { Skeleton } from "@/components/ui/skeleton"

export function CustomerDetailsSkeleton() {
  return (
    <div className="md:col-span-2">
      <div className="flex items-center gap-2 mb-5 pb-2 border-b">
        <Skeleton className="h-7 w-7" /> {/* Icon placeholder */}
        <Skeleton className="h-6 w-40" /> {/* Title placeholder */}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className={index === 3 ? "col-span-2" : ""}>
            <Skeleton className="h-4 w-20 mb-2" /> {/* Label placeholder */}
            <Skeleton className="h-10 w-full" /> {/* Input placeholder */}
          </div>
        ))}
      </div>
    </div>
  )
}

