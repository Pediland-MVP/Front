'use client';

import { Card } from '@/components/ui/card';
import { Sidebar, ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export default function ConversationsListSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-white lg:w-1/3">
      <Card className="box-border flex h-full w-full flex-col overflow-hidden rounded-none border-l-2 border-gray-100 p-4">
        <div className="mb-4 flex w-full justify-between lg:hidden">
          <Sidebar className="h-6 w-6 rounded-md bg-gray-200 text-gray-300" />
          <ArrowLeft className="h-6 w-6 rounded-md bg-gray-200 text-gray-300" />
        </div>

        <div className="w-full flex-grow space-y-4 overflow-y-auto">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="box-border flex items-center gap-4 rounded-lg bg-gray-100 p-2"
            >
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
              <div className="flex w-full flex-col">
                <div className="mb-2 h-4 w-3/4 rounded-md bg-gray-200"></div>
                <div className="h-3 w-1/2 rounded-md bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
