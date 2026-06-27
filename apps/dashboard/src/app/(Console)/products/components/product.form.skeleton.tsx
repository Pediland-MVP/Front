import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductFormSkeleton = () => {
  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex-1 p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
          <Skeleton className="mt-4 h-10 w-24" />
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
};

export default ProductFormSkeleton;
