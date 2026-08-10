'use client';
import React, { useEffect } from 'react';
import type { IconProps } from '@phosphor-icons/react/dist/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export default function SidebarContent({ items, selectedItem, onSelect }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="_sidebar">
      <ul className="space-y-2">
        {items.map((item) => (
          <Link key={item.path} href={item.path}>
            <li
              className={`flex cursor-pointer items-center gap-2 rounded p-2 ${
                pathname.startsWith(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
