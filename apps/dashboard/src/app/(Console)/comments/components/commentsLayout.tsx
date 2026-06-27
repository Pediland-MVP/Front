'use client';

import React, { Suspense } from 'react';

import CommentsList from './commentsList';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function CommentsLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex w-full">
      <div className="lg:w-1/3">
        <Suspense>
          <CommentsList />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
