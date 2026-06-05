// src/components/nav-main.tsx
"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CaretDownIcon } from "@phosphor-icons/react";
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
              variant={"outline"}
              asChild
              isActive={pathname === item.url}
            >
              <button
                onClick={() => navigate(item.url)}
                className="flex w-full cursor-pointer items-center gap-2 text-left"
              >
                <item.icon
                  weight={pathname === item.url ? "duotone" : "regular"}
                  size={22}
                />
                <span>{item.title}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
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
            variant={"outline"}
            isActive={isChildActive}
            className="flex w-full cursor-pointer items-center gap-2 text-left"
          >
            <item.icon
              weight={isChildActive ? "duotone" : "regular"}
              size={22}
            />
            <span className="flex-1">{item.title}</span>
            <CaretDownIcon
              size={14}
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === child.url}
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
