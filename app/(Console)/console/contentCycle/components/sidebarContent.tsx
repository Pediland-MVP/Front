"use client";
import React from "react";

type SidebarItem = {
  title: string;
  icon: React.ComponentType;
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
    <div className="fixed  z-50  h-[96.5%]  w-full max-w-[20rem] bg-white shadow-md rounded-2xl px-4 py-4">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.key}
            className={`font-semibold text-md px-2 py-2 rounded-xl flex items-center gap-2 cursor-pointer ${
              selectedItem === item.key ? "bg-blue-100 text-blue-700" : "text-gray-700"
            }`}
            onClick={() => onSelect(item.key)}
          >
            <item.icon />
            {item.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
