// app/(Console)/auth/layout/header.tsx
"use client";
import Link from "next/link";
import AuthButtons from "./authButtons";
import { Infinity } from "@phosphor-icons/react/dist/ssr";

export default function AuthHeader() {
  return (
    <header className="bg-fuchsia-50/75">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className="_wrap flex items-center justify-between py-2 sm:py-3">
          <div className="_logo">
            <Link
              href="/"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-primary"
            >
              <Infinity size={30} className="text-white" />
            </Link>
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
