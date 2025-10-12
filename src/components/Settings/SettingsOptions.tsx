"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import {
  CreditCardIcon,
  PaypalLogoIcon,
  PlugIcon,
  RocketIcon,
} from "@phosphor-icons/react";

export const SettingsOptions = () => {
  const t = useTranslations("Settings.Navigation");

  const items = [
    {
      title: t("accounts"),
      url: "/settings/instagram",
      icon: PlugIcon,
    },
    {
      title: t("bankAccounts"),
      url: "/settings/card",
      icon: CreditCardIcon,
    },
    {
      title: t("zarinpal"),
      url: "/settings/zarinpal",
      icon: PaypalLogoIcon,
    },
    {
      title: t("upgradePlan"),
      url: "/settings/upgrade",
      icon: RocketIcon,
    },
  ];

  const pathname = usePathname();

  return (
    <div className="h-full w-full rounded-t-3xl border-gray-100 bg-white px-4 py-5 md:rounded-t-none md:border-l-2 md:p-4">
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index}>
            <Link
              href={item.url}
              className={cn(
                "group text-secondary flex items-center gap-2.5 rounded-md bg-blue-50 p-4 font-medium duration-300 hover:bg-blue-100/80 md:p-3",
                pathname.startsWith(item.url) && "bg-blue-100",
              )}
            >
              <item.icon className="group-hover:text-secondary size-6 duration-300 md:size-5" />
              <span className="group-hover:text-secondary text-sm duration-300">
                {item.title}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
