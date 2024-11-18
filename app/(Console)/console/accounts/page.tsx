"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";

export default function AccountPage() {
  return (
    <div className="_accounts">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">مدیریت اکانت‌ها</h1>

        <div className="_tools">
          <Link href="/console/products/add">
            <Button>
              افزودن <Plus className="mr-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="_cards grid grid-cols-5 gap-5">
        <Suspense>
          <Accounts />
        </Suspense>
      </div>
    </div>
  );
}
