import { Skeleton } from '@/components/ui/skeleton';

export function PaymentSkeleton() {
  return (
    <div className="md:col-span-4">
      <div className="mb-5 flex items-center gap-2 border-b pb-2">
        <Skeleton className="h-7 w-7" /> {/* Icon placeholder */}
        <Skeleton className="h-6 w-36" /> {/* Title placeholder */}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" /> {/* Radio button placeholder */}
            <Skeleton className="h-5 w-48" /> {/* Label placeholder */}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" /> {/* Radio button placeholder */}
            <Skeleton className="h-5 w-36" /> {/* Label placeholder */}
          </div>
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-64" /> {/* File uploader label placeholder */}
          <Skeleton className="h-[468px] max-w-[400px]" /> {/* File uploader input placeholder */}
        </div>
      </div>
    </div>
  );
}
