import React from 'react';
import { Skeleton } from "@befroosh/ui";

const ProductFormSkeleton = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
          <Skeleton className="h-10 w-24 mt-4" />
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="w-full h-96 rounded-lg" />
      </div>
    </div>
  );
};

export default ProductFormSkeleton;