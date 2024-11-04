"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconProps } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface NavProps {
  links: {
    title: string;
    label?: string;
    icon: React.ElementType<IconProps>; // Adjusted to work with Phosphor icons
    href: string;
  }[];
}

export function Nav({ links }: NavProps) {
  const pathName = usePathname();
  const currentPath = pathName.split("/")[2];

  return (
    <div className="_navigation py-5 shadow bg-white rounded-xl group flex flex-col transition-all duration-300 gap-12 h-full">
      <div className="_logo flex items-center gap-3 px-4">
        <Image
          src="/images/tabdeal-logo.svg"
          alt="TapDeal Logo"
          width={40}
          height={20}
          className="w-[40px] h-[20px]"
          priority
        />
        <span className="font-bold text-lg">تـبـدیـل</span>
      </div>

      <nav className="flex flex-col">
        {links.map((link, index) => (
          <div key={index}>
            <Link
              href={link.href}
              className={`flex items-center px-4 py-2.5 gap-4 border-y border-dashed duration-300 hover:text-pink-700 hover:bg-pink-50 hover:border-pink-100 ${
                currentPath === link.href.split("/")[2]
                  ? "bg-pink-50 text-pink-700 border-pink-100"
                  : "border-white"
              }`}
            >
              <div className="_icon flex">
                {currentPath === link.href.split("/")[2] ? (
                  <link.icon
                    size={28}
                    className="text-pink-700"
                    weight="duotone"
                  />
                ) : (
                  <link.icon size={28} weight="light" />
                )}
              </div>
              <span
                className={`_text font-medium pl-6 whitespace-nowrap`}
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
          </div>
        ))}
      </nav>
    </div>
  );
}
