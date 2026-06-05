import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/layout/header";
import { LayoutPage } from "@/components/layout/LayoutPage";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <LayoutPage className="overflow-hidden">
            {children}
          </LayoutPage>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
