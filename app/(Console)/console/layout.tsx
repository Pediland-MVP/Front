"use client";

import * as React from "react";
import { Nav } from "@/app/(Console)/console/components/nav";
import {
  AddressBookTabs,
  ChatCircleText,
  HouseSimple,
  Lightning,
  Question,
  Sliders,
  Storefront,
  User,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="_wrap flex w-full p-4">
      <div className="_navigation h-full z-50">
        <Nav
          links={[
            {
              title: "داشبورد",
              icon: HouseSimple,
              variant: "default",
              href: "/console/",
            },
            {
              title: "ارتباطات",
              icon: AddressBookTabs,
              variant: "default",
              href: "/console/contacts",
            },
            {
              title: "صندوق پیام‌ها",
              icon: ChatCircleText,
              variant: "default",
              href: "/console/inbox",
            },

            {
              title: "اقدامات",
              icon: Lightning,
              variant: "ghost",
              href: "/console/actions",
            },
            {
              title: "محصولات",
              icon: Storefront,
              variant: "ghost",
              href: "/console/products",
            },
            // {
            //   title: "مالی",
            //   icon: Wallet,
            //   variant: "ghost",
            //   href: "/console/accounts",
            // },
            // {
            //   title: "تنظیمات",
            //   icon: Sliders,
            //   variant: "ghost",
            //   href: "/console/settings",
            // },
            {
              title: "مدیریت حساب‌ها",
              icon: User,
              variant: "ghost",
              href: "/console/accounts",
            },
            {
              title: "پشتیبانی",
              icon: Question,
              variant: "ghost",
              href: "/console/support",
            },
          ]}
        />
      </div>

      <main className="z-10 w-full mr-[72px]">{children}</main>
    </div>
  );
};

export default Layout;
