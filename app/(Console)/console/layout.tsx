
import { getLocale } from "next-intl/server";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/theme/ui/sidebar";

const Layout = async ({ children }: { children: React.ReactNode }) => {

  const locale = await getLocale();

  return (
    <SidebarProvider>
      <AppSidebar side={locale==='fa'?'right':'left'} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
