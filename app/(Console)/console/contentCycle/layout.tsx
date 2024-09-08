"use client"
import { FC, useState } from "react";
import SidebarContent from "./components/sidebarContent";
import { CurrencyCircleDollar } from "@phosphor-icons/react/dist/ssr";

type ChatsLayoutProps = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayoutProps> = ({ children }) => {
  const sideBarItems = [
    {
      title: "چرخه محتوا",
      icon: CurrencyCircleDollar,
      key: "content-cycle",
    },
    {
      title: "مدیریت کاربران",
      icon: CurrencyCircleDollar, // Replace with appropriate icon
      key: "user-management",
    },
    {
      title: "تنظیمات",
      icon: CurrencyCircleDollar, // Replace with appropriate icon
      key: "settings",
    },
  ];

  const [selectedItem, setSelectedItem] = useState(sideBarItems[0].key);

  return (
    <div className="h-full w-full flex pr-6 gap-4">
      {/* Sidebar */}
      <SidebarContent 
        items={sideBarItems} 
        selectedItem={selectedItem} 
        onSelect={setSelectedItem} 
      />
      
      {/* Main content */}
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default ChatsLayout;
