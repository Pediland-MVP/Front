"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@components";
import { CaretLeftIcon } from "@phosphor-icons/react";

export const NavMain = ({
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
}) => {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isSubMenuActive = item.items?.some((subItem) =>
            pathname.startsWith(subItem.url),
          );

          const isOpen =
            openMenu === item.title || item.isActive || isSubMenuActive;

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
                      className={cn(
                        "border border-dashed border-transparent text-secondary",
                        pathname === item.url
                          ? "text-foreground hover:text-foreground bg-blue-50"
                          : "hover:text-primary active:text-primary data-[state=open]:text-primary data-[state=open]:hover:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100 data-[state=open]:border-violet-300/70 data-[state=open]:bg-violet-100 data-[state=open]:hover:bg-violet-100",
                      )}
                      onClick={() => {
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
                    className={cn(
                      "border border-dashed border-transparent text-secondary",
                      pathname === item.url
                        ? "text-primary hover:text-primary active:text-primary border-violet-300/70 bg-violet-100 hover:bg-violet-100 active:bg-violet-100"
                        : "hover:text-primary active:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100",
                    )}
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
                      <SidebarMenuAction className="-mt-0.5 data-[state=open]:-rotate-90">
                        <CaretLeftIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                "border border-dashed border-transparent",
                                pathname.startsWith(subItem.url)
                                  ? "text-primary hover:text-primary active:text-primary active:bg-transparent"
                                  : "hover:text-primary active:text-primary text-secondary active:bg-transparent",
                              )}
                              onClick={() => {
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
};
