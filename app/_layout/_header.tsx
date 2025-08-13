"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import Link from "next/link";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/theme/ui/accordion";
import {
  CaretDown,
  CaretLeft,
  EnvelopeSimple,
  Infinity,
  InstagramLogo,
  List,
  X,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import MegaMenuXl from "@/components/megaMenuXl";

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
      className={`fixed top-0 z-10 flex w-full flex-col items-center justify-between bg-white py-3 shadow-sm lg:py-4 ${
        showMenu ? "border-primary border-b-2" : ""
      } `}
    >
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 xl:px-0">
        <div className={`_wrapper flex justify-between gap-5 sm:gap-10`}>
          <div className="_logo">
            <a href="/#top">
              <Image
                src="/images/befroosh-logo.svg"
                alt="logo"
                width={46}
                height={44}
              />
            </a>
          </div>

          <div className="_navigation flex flex-1 items-center justify-center">
            <ul className="text-primary flex gap-5 text-[15px] font-semibold sm:text-base lg:gap-10">
              <li>
                <Link href="/#features" className="hover:text-secondary">
                  {t("features")}
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-secondary">
                  {t("contactUs")}
                </Link>
              </li>
              <li className="hidden lg:block">
                <Link href="/auth/signup" className="hover:text-secondary">
                  {t("signup")}
                </Link>
              </li>
              <li className="lg:hidden">
                <Link href="/auth/signin" className="hover:text-secondary">
                  {t("signin")}
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

          <div className="_buttons hidden items-center gap-3 sm:flex sm:gap-4 xl:gap-6">
            <Button className="hidden sm:flex" asChild>
              <Link href="/auth/signin">{t("signin")}</Link>
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
              className="mb-4 w-full border-b pb-4"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <div key={item.key} className="rounded-xl bg-blue-100 px-4">
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
            <div className="flex cursor-pointer flex-col gap-4">
              <a href="/contact">
                <div className="flex items-center gap-2">
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
