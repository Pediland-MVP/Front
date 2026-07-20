// src/components/nav-main.tsx
'use client';

import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
} from '@/components/ui/sidebar';
import { CaretLeftIcon } from '@phosphor-icons/react';
import { type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

  const activeParentTitle = items.find((item) =>
    item.children?.some((child) => pathname === child.url),
  )?.title;
  const [openTitle, setOpenTitle] = useState<string | null>(activeParentTitle ?? null);

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
              open={openTitle === item.title}
              onOpenChange={(open) => setOpenTitle(open ? item.title : null)}
            />
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={cn(
                  'text-secondary border border-dashed border-transparent',
                  pathname === item.url
                    ? 'text-primary hover:text-primary active:text-primary border-violet-300/70 bg-violet-100 hover:bg-violet-100 active:bg-violet-100'
                    : 'hover:text-primary active:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100',
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
  open,
  onOpenChange,
}: {
  item: NavItem;
  pathname: string;
  navigate: (url: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isChildActive = item.children?.some((c) => pathname === c.url) ?? false;
  const itemRef = useRef<HTMLLIElement>(null);

  // Opening a menu near the bottom pushes its children past the sidebar's
  // visible area. Once the children are in the DOM, pull the whole item back
  // into view. 'nearest' scrolls the minimum needed, so a menu that already
  // fits does not move at all.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      itemRef.current?.scrollIntoView({
        block: 'nearest',
        // matchMedia is missing in jsdom, so guard it rather than throw.
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
          ? 'auto'
          : 'smooth',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <SidebarMenuItem ref={itemRef}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className={cn(
              'text-secondary border border-dashed border-transparent',
              isChildActive
                ? 'text-foreground hover:text-foreground bg-blue-50'
                : 'hover:text-primary active:text-primary data-[state=open]:text-primary data-[state=open]:hover:text-primary hover:border-violet-300/70 hover:bg-violet-100 active:bg-violet-100 data-[state=open]:border-violet-300/70 data-[state=open]:bg-violet-100 data-[state=open]:hover:bg-violet-100',
            )}
            onClick={() => {
              if (!open) onOpenChange(true);
            }}
          >
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
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
                    'border border-dashed border-transparent',
                    pathname === child.url
                      ? 'text-primary hover:text-primary active:text-primary active:bg-transparent'
                      : 'hover:text-primary active:text-primary text-secondary active:bg-transparent',
                  )}
                  onClick={() => {
                    onOpenChange(true);
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
