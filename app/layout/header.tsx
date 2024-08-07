"use client";
import { Button } from "@/components/ui/button";
import { InstagramLogo, List, X } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useState } from "react";
// import { GrClose } from "react-icons/gr";
// import { GiHamburgerMenu } from "react-icons/gi";

function Header() {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <header className="w-full top-0 fixed z-10 justify-between items-center flex flex-col px-4 sm:px-10 py-4 sm:py-7 shadow-sm bg-white">
      <div className=" max-w-[72rem] w-full flex justify-between">
        <div
          className={`w-full flex justify-between flex-row-reverse sm:flex-row sm:justify-start items-center xl:justify-around sm:border-none`}
        >
          <div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="sm:hidden font-bold text-xl hover:text-gray-500"
            >
              {showMenu ? (
                <X size={28} color="#787777" />
              ) : (
                <List size={25} color="#787777" />
              )}
            </button>
          </div>
          <div className="w-full flex gap-8 items-center">
            <div className="flex mt-0 text-blue-700">
              <a href="/" className="font-bold text-2xl">
                <InstagramLogo size={40} />
              </a>
            </div>
            <div className="hidden sm:flex w-full justify-between items-center ">
              <ul className="flex gap-8 ">
                <li>
                  <a href="#" className="hover:text-gray-500">
                    امکانات
                  </a>
                </li>
                <li>
                  <a href="/prices" className="hover:text-gray-500">
                    تعرفه ها
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-gray-500">
                    تماس با ما
                  </a>
                </li>
              </ul>
              <div className="flex gap-8">
                <Button variant="outline">ورود</Button>
                <Button variant="secondary">ثبت نام</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="sm:hidden w-full">
        <div className="flex w-full">
          {showMenu && (
            <ul
              className={`flex flex-col  h-[92vh] px-4 py-4 gap-4 font-light absolute right-0 left-0 top-[4.2rem] z-20 bg-white`}
            >
              <li>
                <a href="/features" className="hover:text-gray-500">
                  امکانات
                </a>
              </li>
              <li>
                <a href="/prices" className="hover:text-gray-500">
                  تعرفه ها
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-gray-500">
                  تماس با ما
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-500">
                  پنل کاربری{" "}
                </a>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
