// src/layout/header.tsx

import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Header() {
  return (
    <header className="flex min-h-14 items-center gap-2 px-3 md:bg-white">
      <SidebarTrigger />
      <AppBreadcrumb />
    </header>
  );
}
