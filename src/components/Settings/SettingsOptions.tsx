"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CreditCardIcon,
  CrownSimpleIcon,
  InstagramLogoIcon,
  PasswordIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

export const SettingsOptions = () => {
  const t = useTranslations("Settings.Navigation");

  const items = [
    {
      title: t("accounts"),
      url: "/settings/instagram",
      icon: InstagramLogoIcon,
    },
    {
      title: t("upgrade_plan"),
      url: "/settings/upgrade",
      icon: CrownSimpleIcon,
    },
    {
      title: t("bank_accounts"),
      url: "/settings/card",
      icon: CreditCardIcon,
    },
    // {
    //   title: t("zarinpal"),
    //   url: "/settings/zarinpal",
    //   icon: PaypalLogoIcon,
    // },
    {
      title: t("profile"),
      url: "/settings/profile",
      icon: UserCircleIcon,
    },
    {
      title: t("password"),
      url: "/settings/password",
      icon: PasswordIcon,
    },
  ];

  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2.5 px-4 py-5 md:p-0">
      {items.map((item, index) => (
        <div key={index}>
          <Link
            href={item.url}
            className={cn(
              "group text-secondary flex h-12 min-w-60 items-center gap-2.5 rounded-md bg-blue-50 px-4 font-medium shadow shadow-blue-200/90 duration-300 hover:bg-blue-100/80 md:h-11 md:px-3",
              pathname.startsWith(item.url) && "bg-blue-100",
            )}
          >
            <item.icon
              className="group-hover:text-secondary size-5.5 duration-300 md:size-5"
              weight="duotone"
            />
            <span className="group-hover:text-secondary text-sm duration-300">
              {item.title}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
};
