"use client";

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
import React from "react";
import { useState } from "react";
import MegaMenuXl from "../(layout)/components/megaMenuXl";
import Link from "next/link";

function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuXl, setShowMenuXl] = useState<string | null>(null);
  return (
    <header
      className={`w-full top-0 fixed z-10 justify-between items-center flex flex-col px-4 sm:px-10 py-4 sm:py-7 shadow-sm bg-white ${
        showMenu ? "md:border-blueKommo md:border-b-2 " : ""
      } `}
    >
      <div className=" max-w-[72rem] w-full flex justify-between">
        <div
          className={`w-full flex justify-between flex-row-reverse xl:flex-row sm:justify-start items-center xl:justify-around sm:border-none`}
        >
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
                <Link href="/auth/login">
                  <Button variant="outline">ورود</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary">ثبت نام</Button>
                </Link>
              </div>
            </div>
            <div className="hidden xl:flex w-full justify-between items-center ">
              <ul className="flex gap-8 cursor-pointer ">
                <li
                  onClick={() => {
                    setShowMenuXl("features");
                    setShowMenu(!showMenu);
                  }}
                >
                  <span className="hover:text-gray-500 flex items-center gap-2">
                    امکانات <CaretDown size={12} />
                  </span>
                </li>
                <li
                  onClick={() => {
                    setShowMenuXl("product");
                    setShowMenu(!showMenu);
                  }}
                >
                  <span className="hover:text-gray-500 flex items-center gap-2">
                    محصولات <CaretDown size={12} />
                  </span>
                </li>
                <li>
                  <a
                    href="prices"
                    className="hover:text-gray-500 flex items-center gap-2"
                  >
                    تعرفه ها
                  </a>
                </li>
              </ul>
              <div className="flex gap-8">
                <Link href="/auth/login">
                  <Button variant="outline">ورود</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary">ثبت نام</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* features xl */}
      {showMenuXl === "features" && showMenu && (
        <MegaMenuXl title1="امکانات" title2="لورم اپیزوم" list2="" list1="" />
      )}

      {/* product xl */}
      {showMenuXl === "product" && showMenu && (
        <MegaMenuXl title1="محصولات" title2="لورم اپیزوم" list2="" list1="" />
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
                <div className=" flex flex-col gap-4 ">
                  <div className=" bg-purple-100 px-4 rounded-xl">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>امکانات</AccordionTrigger>
                      <div>
                        <AccordionContent>
                          <a href="#">لور اپیزومم</a>
                        </AccordionContent>
                        <AccordionContent>
                          <a href="#">لور اپیزومم</a>
                        </AccordionContent>
                        <AccordionContent>
                          <a href="#">لور اپیزومم</a>
                        </AccordionContent>
                      </div>
                    </AccordionItem>
                  </div>
                  <div className=" bg-purple-100 px-4 rounded-xl">
                    <AccordionItem value="item-2">
                      <AccordionTrigger>محصولات</AccordionTrigger>
                      <AccordionContent>
                        Yes. It comes with default styles that matches the other
                        components&apos; aesthetic.
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                  <div className=" bg-purple-100 px-4 py-4 rounded-xl">
                    تعرفه ها
                  </div>
                </div>
              </Accordion>
              <div className="flex flex-col gap-4 cursor-pointer">
                <a href="/contact">
                  <div className="flex gap-2 pt-4 px-4 items-center">
                    <span>
                      <EnvelopeSimple size={28} />
                    </span>
                    تماس با ما
                  </div>
                </a>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-blueKommo">
                    ورود
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="secondary"
                    className="bg-blueKommo text-white"
                  >
                    ثبت نام
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {showMenu && (
          <div className="hidden md:block xl:hidden  w-full bg-white ">
            <div className="flex px-[4.5rem] py-7 gap-[12rem] ">
              <div>
                <h2 className="font-semibold text-xl">امکانات</h2>
                <h3 className="text-md "></h3>
                <ul className="leading-[2rem] mt-4">
                  <li>
                    <a className="flex items-center gap-1">
                      لورم اپیزوم <CaretLeft size={13} />
                    </a>
                  </li>
                  <li>
                    <a className="flex items-center gap-1">
                      لورم اپیزوم <CaretLeft size={13} />
                    </a>
                  </li>
                  <li>
                    <a className="flex items-center gap-1">
                      لورم اپیزوم <CaretLeft size={13} />
                    </a>
                  </li>
                  <li>
                    <a className="flex items-center gap-1">
                      لورم اپیزوم <CaretLeft size={13} />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="font-semibold text-xl">محصولات</h2>
                <ul className="leading-[2rem] mt-4">
                  <li>
                    <li>
                      <a className="flex items-center gap-1">
                        لورم اپیزوم <CaretLeft size={13} />
                      </a>
                    </li>
                    <li>
                      <a className="flex items-center gap-1">
                        لورم اپیزوم <CaretLeft size={13} />
                      </a>
                    </li>
                    <li>
                      <a className="flex items-center gap-1">
                        لورم اپیزوم <CaretLeft size={13} />
                      </a>
                    </li>
                    <li>
                      <a className="flex items-center gap-1">
                        لورم اپیزوم <CaretLeft size={13} />
                      </a>
                    </li>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col w-full px-[4.5rem] py-7 gap-4 border-b">
              <div className="w-full bg-purple-100 p-4 rounded-xl">
                <a href="/prices" className="flex items-center gap-1">
                  تعرفه ها
                  <CaretLeft size={13} />
                </a>
              </div>
              <div className="w-full bg-purple-100 p-4 rounded-xl">
                <a className="flex items-center gap-1">
                  تعرفه ها
                  <CaretLeft size={13} />
                </a>
              </div>
            </div>
            <div className="px-[4.5rem]">
              <a className="flex items-center pt-4">
                <EnvelopeSimple size={28} className="pl-1" />
                تماس با ما
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
