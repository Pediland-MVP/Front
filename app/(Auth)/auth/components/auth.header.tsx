// app/(Console)/auth/layout/header.tsx
"use client";

import Image from "next/image";
import AuthButtons from "./authButtons";

export default function AuthHeader() {
  return (
    <header className="shadow-sm shadow-slate-50 border-b border-slate-100">
      <div className="container max-w-6xl px-3 sm:px-0">
        <div className="_wrap flex items-center justify-between py-2 sm:py-3">
          <div className="_logo">
            <Image
              src="/images/tabdeal-logo.svg"
              alt="Logo"
              width={63}
              height={30}
              className="w-[63px] h-[30px]"
              priority
            />
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}