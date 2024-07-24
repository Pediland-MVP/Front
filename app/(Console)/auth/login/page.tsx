"use client";
import React from "react";

import {
    Eye,
    EyeSlash,
    GoogleLogo,
    Lock
} from "@phosphor-icons/react";
import AuthHeader from "../layout/header";
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import Link from "next/link";

export default function Login() {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <main className="_login pt-14 sm:pt-0 h-full relative">
      <AuthHeader />

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <Lock size={32} />
            <h1 className="text-xl font-semibold">ورود به حساب کاربری</h1>
          </div>
          <div className="_form">
            <div className="grid grid-cols-4 gap-3 mb-5">
              <Input
                className="col-span-4"
                type="text"
                // label="شماره همراه"
                // isClearable
              />
              <Input
                type={isVisible ? "text" : "password"}
                className="col-span-4"
                // label="رمز عبور"
                // endContent={
                //   <button
                //     className="focus:outline-none"
                //     type="button"
                //     onClick={toggleVisibility}
                //   >
                //     {isVisible ? (
                //       <Eye size={22} className="text-gray-400" />
                //     ) : (
                //       <EyeSlash size={22} className="text-gray-400" />
                //     )}
                //   </button>
                // }
              />
              <div className="flex justify-end col-span-4">
                <Link
                  href={"/auth/reset"}
                  className="col-span-4 text-sm text-gray-400 hover:text-gray-700 font-light duration-300"
                >
                  رمز عبورم را فراموش کردم.
                </Link>
              </div>
            </div>
            <Button
              className="w-full text-white"
              color="success"
            //   radius="full"
              size="lg"
            >
              ورود
            </Button>
            {/* <Divider className="my-6 bg-gray-100" /> */}
            <Button
              className="pr-4"
              color="primary"
            //   radius="full"
              size="lg"
              // startContent={<GoogleLogo weight="bold" size={28} />}
            >
              ورود با اکانت گوگل
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
