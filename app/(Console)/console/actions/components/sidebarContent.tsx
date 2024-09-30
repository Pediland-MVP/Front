"use client";
import React, { useEffect } from "react";
import { IconProps } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  title: string;
  icon: React.ElementType<IconProps>; // Adjusted to work with Phosphor icons
  path: string;
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
  const pathname = usePathname()

  return (
    <div className="_sidebar">
      <ul className="space-y-2">
        {items.map((item) => (
          <Link href={item.path}>
            <li
              key={item.path}
              className={`p-2 rounded flex items-center gap-2 cursor-pointer ${pathname === item.path ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
            >
              <item.icon size={22} weight="light" />
              {item.title}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}
