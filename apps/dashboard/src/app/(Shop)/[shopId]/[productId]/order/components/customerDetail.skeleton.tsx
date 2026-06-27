import { Skeleton } from '@/components/ui/skeleton';

export function CustomerDetailsSkeleton() {
  return (
    <div className="md:col-span-2">
      <div className="mb-5 flex items-center gap-2 border-b pb-2">
        <Skeleton className="h-7 w-7" /> {/* Icon placeholder */}
        <Skeleton className="h-6 w-40" /> {/* Title placeholder */}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[...Array(5)].map((_, index) => (
          <div key={index} className={index === 3 ? 'col-span-2' : ''}>
            <Skeleton className="mb-2 h-4 w-20" /> {/* Label placeholder */}
            <Skeleton className="h-10 w-full" /> {/* Input placeholder */}
          </div>
        ))}
      </div>
    </div>
  );
}
