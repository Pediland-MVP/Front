"use client";

import React, { Suspense, useEffect, useState } from "react";

import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";
import CommentsList from "./commentsList";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function CommentsLayout({ children }: ChatLayoutProps) {

  return (
    <>
      <div className="w-full flex h-full justify-center items-center gap-x-2 mr-4">
        <div className="w-2/6">
          <Suspense>
            <CommentsList/>
          </Suspense>
        </div>

        {children}
      </div>
    </>
  );
}
