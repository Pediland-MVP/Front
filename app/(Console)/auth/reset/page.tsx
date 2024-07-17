"use client";
import React from "react";
import { Button, Divider, Input } from "@nextui-org/react";
import {
  Eye,
  EyeSlash,
  GoogleLogo,
  Keyhole,
  UserCirclePlus,
} from "@phosphor-icons/react";
import AuthHeader from "../layout/header";

export default function ResetPassword() {
  const [isVisible, setIsVisible] = React.useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <main className="_reset h-full relative">
      <AuthHeader />

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <Keyhole size={32} />
            <h1 className="text-xl font-semibold">فراموشی رمز عبور</h1>
          </div>
          <div className="_form">
            <div className="grid grid-cols-4 gap-3 mb-5">
              <Input
                className="col-span-4"
                type="text"
                label="شماره همراه"
                isClearable
              />
            </div>
            <Button
              className="w-full text-white"
              color="success"
              radius="full"
              size="lg"
            >
              ثبت درخواست
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
