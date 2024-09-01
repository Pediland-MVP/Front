"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconProps, MetaLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

interface NavProps {
  links: {
    title: string;
    label?: string;
    icon: React.ElementType<IconProps>; // Adjusted to work with Phosphor icons
    variant: "default" | "ghost";
    href: string;
  }[];
}

export function Nav({ links }: NavProps) {
  const pathName = usePathname();
  const currentPath = pathName.split("/")[2];

  return (
    <div
      className="absolute z-50 px-[.5rem] py-4 shadow-md bg-white rounded-xl h-[96.8%] group flex flex-col transition-all duration-300"
      style={{ width: "56px" }}
      onMouseEnter={(e) => (e.currentTarget.style.width = "220px")}
      onMouseLeave={(e) => {(e.currentTarget.style.width = "56px") }}
    >
      <div className="flex items-center font-semibold pb-12 w-full">
        <div className="">
          <MetaLogo size={32} weight="bold" />
        </div>
        <span
          className={cn(
            "whitespace-nowrap mx-[.75rem] transition-all duration-300 text-bold",
            "max-w-0 opacity-0 group-hover:max-w-full group-hover:opacity-100 text-semibold"
          )}
        >
          تبدیل
        </span>
      </div>

      <nav className="flex flex-col gap-6">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="flex items-center transition-all duration-300 px-1  hover:bg-gray-100 rounded-lg"
          >
            <div className="">
              {currentPath === link.href.split("/")[2] ? (
                <link.icon size={32} color="red" weight="duotone" />
              ) : (
                <link.icon size={32} />
              )}
            </div>
            {/* Icon size adjusted to Phosphor's design */}
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden transition-all duration-300 ",
                " opacity-0 px-[.75rem] group-hover:max-w-full group-hover:opacity-100"
              )}
            >
              {link.title}
            </span>
            {link.label && (
              <span
                className={cn(
                  "ml-auto text-muted-foreground transition-all duration-300 ",
                  "max-w-0 opacity-0  group-hover:max-w-full group-hover:opacity-100"
                )}
                style={{ transitionDelay: "0.2s" }}
              >
                {link.label}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
