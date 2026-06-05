// src/layout/header.tsx

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  return (
    <header className="flex h-14 items-center gap-4 px-4 bg-white/80 backdrop-blur-md border-b border-border/40">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="h-4"
      />
      <AppBreadcrumb />
    </header>
  );
}
