import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonButtonProps {
  className?: string;
}

export function UploadTransactionSkeleton({ className }: SkeletonButtonProps) {
  return <Skeleton className={cn('bg-primary/20 h-10 w-full rounded-md', className)} />;
}
