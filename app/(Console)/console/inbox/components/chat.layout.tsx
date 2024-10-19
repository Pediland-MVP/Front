"use client";

import { userData } from "./data";
import React, { useEffect, useState } from "react";

import Sidebar from "./sidebar";
import { SessionStorageKeys } from "@/app/utils/sessionStorageKeys";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({
  children,
}: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(userData[0]);
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
          <Sidebar
            isCollapsed={isCollapsed || isMobile}
            links={userData.map((user) => ({
              name: user.name,
              messages: user.messages ?? [],
              avatar: user.avatar,
              variant: selectedUser.name === user.name ? "grey" : "ghost",
            }))}
            isMobile={isMobile}
          />
        </div>

        {children}
      </div>
    </>
  );
}
