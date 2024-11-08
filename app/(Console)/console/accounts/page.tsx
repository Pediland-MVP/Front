"use client";
// import { ResizablePanel } from "@/registry/new-york/ui/resizable";
import { Suspense } from "react";
import Accounts from "./components/accounts";

export default function AccountPage() {
  return (
    <div className="_accounts">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">لیست اکانت‌ها</h1>

        <div className="_tools"></div>
      </div>
      <div className="_cards grid grid-cols-5 gap-4">
        <Suspense>
          <Accounts />
        </Suspense>
      </div>
    </div>
  );
}
