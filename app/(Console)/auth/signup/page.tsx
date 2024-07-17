"use client";
import React from "react";
import { Button, Divider, Input } from "@nextui-org/react";
import {
  Eye,
  EyeSlash,
  GoogleLogo,
  UserCirclePlus,
} from "@phosphor-icons/react";
import AuthHeader from "../layout/header";

export default function Signup() {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <main className="_signup pt-14 sm:pt-0 h-full relative">
      <AuthHeader />

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <UserCirclePlus size={32} />
            <h1 className="text-xl font-semibold">ثبت نام کاربر جدید</h1>
          </div>
          <div className="_form">
            <div className="grid grid-cols-4 gap-3 mb-5">
              <Input
                className="col-span-4 sm:col-span-2"
                type="text"
                label="نام"
                isClearable
              />
              <Input
                className="col-span-4 sm:col-span-2"
                type="text"
                label="نام خانوادگی"
                isClearable
              />
              <Input
                className="col-span-4"
                type="text"
                label="شماره همراه"
                isClearable
              />
              <Input
                type={isVisible ? "text" : "password"}
                className="col-span-4 sm:col-span-2"
                label="رمز عبور"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <Eye size={20} className="text-gray-400" />
                    ) : (
                      <EyeSlash size={20} className="text-gray-400" />
                    )}
                  </button>
                }
              />
              <Input
                type={isVisible ? "text" : "password"}
                className="col-span-4 sm:col-span-2"
                label="تکرار رمز عبور"
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <Eye size={20} className="text-gray-400" />
                    ) : (
                      <EyeSlash size={20} className="text-gray-400" />
                    )}
                  </button>
                }
              />
            </div>
            <Button
              className="w-full text-white"
              color="success"
              radius="full"
              size="lg"
            >
              ثـبـت نـام
            </Button>
            <Divider className="my-6 bg-gray-100" />
            <Button
              className="pr-4"
              color="primary"
              radius="full"
              size="lg"
              startContent={<GoogleLogo size={28} weight="bold" />}
            >
              ثبت نام با اکانت گوگل
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
