"use client"
import { FC, useState } from "react";
import SidebarContent from "./components/sidebarContent";
import { Recycle, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

type ChatsLayoutProps = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayoutProps> = ({ children }) => {

  return (
    <div className="flex gap-4">
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default ChatsLayout;
