// src/components/nav-main.tsx
"use client";

import { cn } from "@/lib/utils";
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
} from "@/components/ui/sidebar";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  title: string;
  url: string;
  icon: PhosphorIcon;
  isActive?: boolean;
  children?: { title: string; url: string }[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();

  const navigate = (url: string) => {
    if (pathname === url) {
      if (isMobile) setOpenMobile(false);
      return;
    }
    if (isMobile) {
      setOpenMobile(false);
      setTimeout(() => router.push(url), 200);
    } else {
      router.push(url);
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.children ? (
            <CollapsibleNavItem
              key={item.title}
              item={item}
              pathname={pathname}
              navigate={navigate}
            />
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  "text-secondary border border-dashed border-transparent",
                  pathname === item.url
                    ? "text-primary hover:text-primary active:text-primary border-violet-300/70 bg-violet-100 hover:bg-violet-100 active:bg-violet-100"
                    : "hover:text-primary active:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100",
                )}
              >
                <button
                  onClick={() => navigate(item.url)}
                  className="flex w-full cursor-pointer items-center gap-2 text-left"
                >
                  <item.icon weight="duotone" size={24} />
                  <span>{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
  navigate,
}: {
  item: NavItem;
  pathname: string;
  navigate: (url: string) => void;
}) {
  const isChildActive = item.children?.some((c) => pathname === c.url) ?? false;
  const [open, setOpen] = useState(isChildActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className={cn(
              "text-secondary border border-dashed border-transparent",
              isChildActive
                ? "text-foreground hover:text-foreground bg-blue-50"
                : "hover:text-primary active:text-primary data-[state=open]:text-primary data-[state=open]:hover:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100 data-[state=open]:border-violet-300/70 data-[state=open]:bg-violet-100 data-[state=open]:hover:bg-violet-100",
            )}
            onClick={() => {
              if (!open) setOpen(true);
            }}
          >
            <button type="button" className="flex w-full cursor-pointer items-center gap-2 text-left">
              <item.icon weight="duotone" size={24} />
              <span>{item.title}</span>
            </button>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleTrigger asChild>
          <SidebarMenuAction className="-mt-0.5 data-[state=open]:-rotate-90">
            <CaretLeftIcon />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  asChild
                  className={cn(
                    "border border-dashed border-transparent",
                    pathname === child.url
                      ? "text-primary hover:text-primary active:text-primary active:bg-transparent"
                      : "hover:text-primary active:text-primary text-secondary active:bg-transparent",
                  )}
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  <button
                    onClick={() => navigate(child.url)}
                    className="w-full cursor-pointer text-right"
                  >
                    {child.title}
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
