"use client";

import React, { Suspense, useEffect, useState } from "react";

import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";
import CommentsList from "./commentsList";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function CommentsLayout({ children }: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
      sessionStorage.setItem(SessionStorageKeys.IS_MOBILE, "true");
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  return (
    <>
      <div className="w-full flex h-full justify-center items-center gap-x-2 mr-4">
        <div className="w-2/6">
          <Suspense>
            <CommentsList
              isCollapsed={isCollapsed || isMobile}
              isMobile={isMobile}
            />
          </Suspense>
        </div>

        {children}
      </div>
    </>
  );
}
