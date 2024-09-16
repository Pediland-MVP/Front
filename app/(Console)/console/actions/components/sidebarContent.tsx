"use client";
import React from "react";
import { IconProps } from "@phosphor-icons/react";

type SidebarItem = {
  title: string;
  icon: React.ElementType<IconProps>; // Adjusted to work with Phosphor icons
  key: string;
};

type SidebarContentProps = {
  items: SidebarItem[];
  selectedItem: string;
  onSelect: (key: string) => void;
};

export default function SidebarContent({
  items,
  selectedItem,
  onSelect,
}: SidebarContentProps) {
  return (
    <div className="_sidebar">
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.key}
            className={`p-2 rounded flex items-center gap-2 cursor-pointer ${selectedItem === item.key ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            onClick={() => onSelect(item.key)}
          >
            <item.icon size={22} weight="light" />
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
