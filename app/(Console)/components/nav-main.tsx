"use client";

import React, { useState } from "react";
import { Icon } from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/theme/ui/sidebar";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  // state برای کنترل منوی باز شده
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // بررسی می‌کنیم که آیا مسیر فعلی با یکی از زیر آیتم‌های منو تطبیق دارد یا نه
          const isSubMenuActive = item.items?.some((subItem) =>
            pathname.startsWith(subItem.url)
          );

          // منوی باز در صورتی که openMenu برابر با این منو یا به صورت پیش‌فرض فعال باشد
          const isOpen = openMenu === item.title || item.isActive || isSubMenuActive;

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => {
                if (open) {
                  setOpenMenu(item.title);
                } else if (openMenu === item.title) {
                  setOpenMenu(null);
                }
              }}
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={
                        pathname === item.url
                          ? "text-foreground hover:text-foreground bg-blue-100"
                          : "text-gray-700 hover:text-foreground"
                      }
                      onClick={() => {
                        // اگر منو هنوز باز نیست، با کلیک بازش می‌کنیم
                        if (!isOpen) setOpenMenu(item.title);
                      }}
                    >
                      <button type="button">
                        <item.icon size={24} weight="duotone" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={
                      pathname === item.url
                        ? "text-foreground hover:text-foreground bg-blue-100"
                        : "text-gray-700 hover:text-foreground"
                    }
                    onClick={() => {
                      if (isMobile) toggleSidebar();
                    }}
                  >
                    <Link href={item.url}>
                      <item.icon size={24} weight="duotone" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:-rotate-90">
                        <CaretLeft />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={
                                pathname.startsWith(subItem.url)
                                  ? "text-foreground hover:text-foreground bg-blue-100"
                                  : "text-gray-700 hover:text-foreground"
                              }
                              onClick={() => {
                                // وقتی روی زیرمنو کلیک می‌کنیم، openMenu را به منوی والد اختصاص می‌دهیم (و منوهای دیگر بسته می‌شوند)
                                setOpenMenu(item.title);
                                if (isMobile) toggleSidebar();
                              }}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
