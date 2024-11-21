// app/(Console)/auth/layout/header.tsx
"use client";

import AuthButtons from "./authButtons";
import { Infinity } from "@phosphor-icons/react/dist/ssr";

export default function AuthHeader() {
  return (
    <header className="bg-fuchsia-50/75">
      <div className="container max-w-6xl px-3 sm:px-0">
        <div className="_wrap flex items-center justify-between py-2 sm:py-3">
          <div className="_logo flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <Infinity size={26} weight="bold" />
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
