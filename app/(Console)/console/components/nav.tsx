"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconProps, MetaLogo } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
      className="fixed h-[calc(100vh-2rem)] z-50 px-2 py-4 shadow bg-white rounded-xl group flex flex-col transition-all duration-300"
      style={{ width: "56px" }}
      onMouseEnter={(e) => (e.currentTarget.style.width = "220px")}
      onMouseLeave={(e) => { (e.currentTarget.style.width = "56px") }}
    >
      <div className="_logo flex items-center pb-10">
        <Image
          src="/images/tabdeal-logo.svg"
          alt="Logo"
          width={40}
          height={20}
          className="w-[40px] h-[20px]"
          priority
        />
        <span
          className="mx-2 transition-all duration-300 font-bold text-lg max-w-0 opacity-0 group-hover:max-w-full group-hover:opacity-100"
        >
          تـبـدیـل
        </span>
      </div>

      <nav className="flex flex-col justify-center gap-1">
        {links.map((link, index) => (
          <div key={index}>
            <Link
              href={link.href}
              className="flex items-center duration-0 hover:text-red-700 hover:bg-red-50 py-2"
            >
              <div className="flex justify-center px-1">
                {currentPath === link.href.split("/")[2] ? (
                  <link.icon size={30} className="text-red-700" weight="duotone" />
                ) : (
                  <link.icon size={30} weight="light" />
                )}
              </div>
              {/* Icon size adjusted to Phosphor's design */}
              <span className="whitespace-nowrap overflow-hidden transition-all duration-300 opacity-0 px-3 group-hover:max-w-full group-hover:opacity-100">
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
          </div>
        ))}
      </nav>
    </div>
  );
}
