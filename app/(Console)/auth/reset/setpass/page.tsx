"use client";
import React from "react";
import { Button, Divider, Input } from "@nextui-org/react";
import {
  Eye,
  EyeSlash,
  GoogleLogo,
  Key,
  Keyhole,
  UserCirclePlus,
} from "@phosphor-icons/react";
import AuthHeader from "../../layout/header";

export default function SetPassword() {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <main className="_set-password h-full relative">
      <AuthHeader />

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <Key size={28} />
            <h1 className="text-xl font-semibold">بازنشانی رمز عبور</h1>
          </div>
          <div className="_form">
            <div className="grid grid-cols-4 gap-3 mb-5">
              <Input
                type={isVisible ? "text" : "password"}
                className="col-span-4"
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
                className="col-span-4"
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
              ذخـیـره
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
