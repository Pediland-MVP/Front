// app/(Console)/auth/layout/header.tsx
"use client";
import Link from "next/link";
import AuthButtons from "./authButtons";
import { Infinity } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

export default function AuthHeader() {
  return (
    <header className="bg-fuchsia-50/75">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className="_wrap flex items-center justify-between py-2 sm:py-3 lg:py-4">
          <div className="_logo">
            <Link href="/" >
              <Image src="/images/befroosh-logo.svg" alt="logo" width={46} height={44} />
            </Link>
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
