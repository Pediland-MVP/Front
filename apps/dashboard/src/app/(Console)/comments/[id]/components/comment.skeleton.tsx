import { Skeleton } from '@/components/ui/skeleton';

export default function CommentSkeleton() {
  return (
    <div className="flex h-svh flex-col lg:max-h-[calc(100vh-138px)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-16 rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-8 w-full rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
