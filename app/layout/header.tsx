"use client";

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
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
  InstagramLogo,
  List,
  X,
} from "@phosphor-icons/react";
import React, { useState } from "react";
import MegaMenuXl from "../(Site)/components/megaMenuXl";
import Link from "next/link";

function Header() {
  const t = useTranslations('Home.Header');
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuXl, setShowMenuXl] = useState<string | null>(null);

  const navItems = [
    { key: 'features', label: t('features') },
    { key: 'products', label: t('products') },
    { key: 'pricing', label: t('pricing'), link: '/prices' },
  ];

  return (
    <header
      className={`w-full top-0 fixed z-10 justify-between items-center flex flex-col px-4 sm:px-10 py-4 sm:py-7 shadow-sm bg-white ${
        showMenu ? "md:border-blueKommo md:border-b-2 " : ""
      } `}
    >
      <div className="max-w-[72rem] w-full flex justify-between">
        <div className={`w-full flex justify-between flex-row-reverse xl:flex-row sm:justify-start items-center xl:justify-around sm:border-none`}>
          <div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="xl:hidden font-bold text-xl hover:text-gray-500"
            >
              {showMenu ? (
                <X size={28} color="#787777" />
              ) : (
                <List size={25} color="#787777" />
              )}
            </button>
          </div>
          <div className="w-full flex gap-8 items-center">
            <div className="flex mt-0 gap-8 text-blue-700">
              <a href="/" className="font-bold text-2xl">
                <InstagramLogo size={40} />
              </a>

              <div className="hidden sm:flex xl:hidden gap-8 xl:border-b">
                <Link href="/auth/signin">
                  <Button variant="outline">{t('login')}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary">{t('signup')}</Button>
                </Link>
              </div>
            </div>
            <div className="hidden xl:flex w-full justify-between items-center ">
              <ul className="flex gap-8 cursor-pointer ">
                {navItems.map((item) => (
                  <li
                    key={item.key}
                    onClick={() => {
                      if (item.key !== 'pricing') {
                        setShowMenuXl(item.key);
                        setShowMenu(!showMenu);
                      }
                    }}
                  >
                    {item.link ? (
                      <a href={item.link} className="hover:text-gray-500 flex items-center gap-2">
                        {item.label}
                      </a>
                    ) : (
                      <span className="hover:text-gray-500 flex items-center gap-2">
                        {item.label} <CaretDown size={12} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex gap-8">
                <Link href="/auth/signin">
                  <Button variant="outline">{t('login')}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary">{t('signup')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showMenuXl && showMenu && (
        <MegaMenuXl 
          title1={showMenuXl === 'features' ? t('features') : t('products')} 
          title2={t('loremIpsum')} 
          list2="" 
          list1="" 
        />
      )}

      <nav className="xl:hidden w-full ">
        <div className="flex w-full h">
          {showMenu && (
            <div dir="rtl" className="block md:hidden h-[100vh] py-4 w-full">
              <Accordion
                type="single"
                collapsible
                className="w-full border-b pb-4 "
              >
                <div className="flex flex-col gap-4 ">
                  {navItems.map((item) => (
                    <div key={item.key} className="bg-purple-100 px-4 rounded-xl">
                      {item.key === 'pricing' ? (
                        <div className="py-4">{item.label}</div>
                      ) : (
                        <AccordionItem value={item.key}>
                          <AccordionTrigger>{item.label}</AccordionTrigger>
                          <div>
                            {['1', '2', '3'].map((subItem) => (
                              <AccordionContent key={subItem}>
                                <a href="#">{t('loremIpsum')}</a>
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
                  <div className="flex gap-2 pt-4 px-4 items-center">
                    <span>
                      <EnvelopeSimple size={28} />
                    </span>
                    {t('contactUs')}
                  </div>
                </a>
                <Link href="/auth/signin">
                  <Button variant="outline" className="border-blueKommo">
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="secondary"
                    className="bg-blueKommo text-white"
                  >
                    {t('signup')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {showMenu && (
          <div className="hidden md:block xl:hidden w-full bg-white ">
            <div className="flex px-[4.5rem] py-7 gap-[12rem] ">
              {['features', 'products'].map((section) => (
                <div key={section}>
                  <h2 className="font-semibold text-xl">{t(section)}</h2>
                  <ul className="leading-[2rem] mt-4">
                    {[1, 2, 3, 4].map((item) => (
                      <li key={item}>
                        <a className="flex items-center gap-1">
                          {t('loremIpsum')} <CaretLeft size={13} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full px-[4.5rem] py-7 gap-4 border-b">
              {['pricing', 'loremIpsum'].map((item) => (
                <div key={item} className="w-full bg-purple-100 p-4 rounded-xl">
                  <a href={item === 'pricing' ? "/prices" : "#"} className="flex items-center gap-1">
                    {t(item)}
                    <CaretLeft size={13} />
                  </a>
                </div>
              ))}
            </div>
            <div className="px-[4.5rem]">
              <a className="flex items-center pt-4">
                <EnvelopeSimple size={28} className="pl-1" />
                {t('contactUs')}
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;

