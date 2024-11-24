"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import MegaMenuXl from "../(Site)/components/megaMenuXl";
import Link from "next/link";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CaretDown,
  CaretLeft,
  EnvelopeSimple,
  Infinity,
  InstagramLogo,
  List,
  X,
} from "@phosphor-icons/react/dist/ssr";

function Header() {
  const t = useTranslations("Home.Header");
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuXl, setShowMenuXl] = useState<string | null>(null);

  const navItems = [
    { key: "features", label: t("features") },
    { key: "products", label: t("products") },
    { key: "pricing", label: t("pricing"), link: "/prices" },
  ];

  return (
    <header
      className={`bg-white w-full top-0 fixed z-10 justify-between items-center flex flex-col py-3 lg:py-4 shadow-sm ${
        showMenu ? "border-primary border-b-2" : ""
      } `}
    >
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className={`_wrapper flex justify-between gap-10`}>
          <div className="_logo">
            <a
              href="/"
              className="bg-primary flex items-center justify-center w-12 h-12 rounded-full"
            >
              <Infinity size={36} className="text-white" />
            </a>
          </div>

          <div className="_navigation flex flex-1 items-center justify-center">
            <ul className="flex gap-5 lg:gap-10 font-semibold text-primary">
              <li>
                <Link href="/auth/signup" className="hover:text-secondary">
                  ثبت نام رایگان
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-secondary">
                  امکانات
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-secondary">
                  ارتباط
                </Link>
              </li>
            </ul>
            {/* <ul className="flex gap-8 cursor-pointer ">
              {navItems.map((item) => (
                <li
                  key={item.key}
                  onClick={() => {
                    if (item.key !== "pricing") {
                      setShowMenuXl(item.key);
                      setShowMenu(!showMenu);
                    }
                  }}
                >
                  {item.link ? (
                    <a
                      href={item.link}
                      className="hover:text-gray-500 flex items-center gap-2"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="hover:text-gray-500 flex items-center gap-2">
                      {item.label} <CaretDown size={12} />
                    </span>
                  )}
                </li>
              ))}
            </ul> */}
          </div>

          <div className="_buttons hidden sm:flex items-center gap-3 sm:gap-4 xl:gap-6">
            <Button className="hidden sm:flex" asChild>
              <Link href="/console">{t("dashboard")}</Link>
            </Button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="_trigger hidden"
            >
              {showMenu ? (
                <X size={36} className="text-primary" />
              ) : (
                <List size={36} className="text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showMenuXl && showMenu && (
        <MegaMenuXl
          title1={showMenuXl === "features" ? t("features") : t("products")}
          title2={t("loremIpsum")}
          list2="1,2,3"
          list1="5,6,7"
        />
      )}

      {showMenu && (
        <div className="_megamenu w-full px-3 pt-4 pb-1">
          <div dir="rtl" className="_wrapper">
            <Accordion
              type="single"
              collapsible
              className="w-full border-b pb-4 mb-4"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <div key={item.key} className="bg-blue-100 px-4 rounded-xl">
                    {item.key === "pricing" ? (
                      <div className="py-4">{item.label}</div>
                    ) : (
                      <AccordionItem value={item.key}>
                        <AccordionTrigger>{item.label}</AccordionTrigger>
                        <div>
                          {["1", "2", "3"].map((subItem) => (
                            <AccordionContent key={subItem}>
                              <a href="#">{t("loremIpsum")}</a>
                            </AccordionContent>
                          ))}
                        </div>
                      </AccordionItem>
                    )}
                  </div>
                ))}
              </div>
            </Accordion>
            <div className="flex flex-col gap-4 cursor-pointer">
              <a href="/contact">
                <div className="flex gap-2 items-center">
                  <span>
                    <EnvelopeSimple size={28} />
                  </span>
                  {t("contactUs")}
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
