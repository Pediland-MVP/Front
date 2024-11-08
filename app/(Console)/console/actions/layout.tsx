"use client"
import { FC, useState } from "react";
import SidebarContent from "./components/sidebarContent";
import { Recycle, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

type ChatsLayoutProps = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayoutProps> = ({ children }) => {
  const sideBarItems = [
    {
      title: "تکمیل اطلاعات کاربر",
      icon: UserCirclePlus,
      path: "/console/actions/userManagement",
    },
    {
      title: "چرخه محتوا",
      icon: Recycle,
      path: "/console/actions/content-cycle",
    },
  ];

  const [selectedItem, setSelectedItem] = useState(sideBarItems[0].path);

  return (
    <div className="flex gap-4">
      <div className="h-[calc(100vh-2rem)] w-1/5 bg-white shadow rounded-2xl px-2 py-3">
        <SidebarContent
          items={sideBarItems}
          selectedItem={selectedItem}
          onSelect={setSelectedItem}
        />
      </div>

      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default ChatsLayout;
