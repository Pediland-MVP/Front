"use client";

import React, { Suspense } from "react";

import CommentsList from "./commentsList";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function CommentsLayout({ children }: ChatLayoutProps) {

  return (
    <div className="w-full flex">
      <div className="lg:w-1/3">
        <Suspense>
          <CommentsList />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
