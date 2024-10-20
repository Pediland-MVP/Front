"use client";
// import { ResizablePanel } from "@/registry/new-york/ui/resizable";
import { Suspense } from "react";
import Accounts from "./components/accounts";

export default function AccountPage() {

  return (
    <Suspense>
      <Accounts/>
    </Suspense>
  );
}
