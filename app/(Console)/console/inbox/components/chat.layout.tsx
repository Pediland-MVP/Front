"use client";

import React, { useEffect, useState } from "react";
import ChatsList from "./chatsList";
import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
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
    <div className="_chat-layout flex flex-col lg:flex-row gap-5 overflow-auto">
      <div className="lg:w-1/3">
        <ChatsList isCollapsed={isCollapsed || isMobile} isMobile={isMobile} />
      </div>

      {children}
    </div>
  );
}
