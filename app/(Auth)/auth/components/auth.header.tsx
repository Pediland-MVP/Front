// app/(Console)/auth/layout/header.tsx
"use client";

import Image from "next/image";
import AuthButtons from "./authButtons";

export default function AuthHeader() {
  return (
    <header className="absolute top-0 left-0 right-0">
      <div className="container max-w-6xl px-3 sm:px-0">
        <div className="_wrap flex items-center justify-between py-3">
          <div className="_logo">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              width={157}
              height={50}
              className="w-[138px] h-[44px] sm:w-[157px] sm:h-[50px]"
              priority
            />
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}