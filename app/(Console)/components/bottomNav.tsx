import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  onClick?: () => void;
  isMain?: boolean;
}

interface BottomNavbarProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavbarProps) {

  const pathname = usePathname()
  console.log(pathname);
  

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-end justify-around px-2 py-2 gap-x-1">
        {items.map((item, index) => {
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <Button
                key={index}
                asChild
                size="lg"
                className={cn("flex flex-col gap-1 h-16 w-16 rounded-full shadow-lg -mt-6 bg-gray-600", pathname.startsWith(item.href) && 'bg-blue-500')}
                type="button"
                
                {...(item.onClick && { onClick: item.onClick })}
              >
                <Link href={item.href}>
                  <Icon className="h-6 w-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </Button>
            );
          }

          return (
            <Button
              {...(item.onClick && { onClick: item.onClick })}
              type="button"
              key={index}
              variant="ghost"
              size="lg"
              asChild
              className={cn("flex flex-col gap-1 h-12 w-full p-1",pathname.startsWith(item.href) && 'bg-gray-200/70')}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
