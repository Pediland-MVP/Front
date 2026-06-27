import { AppSidebar } from '@/components/app-sidebar';
import { NavBottom } from '@/components/nav-bottom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/layout/header';
import { LayoutPage } from '@/components/layout/LayoutPage';
import { AuthGuard } from '@/components/auth-guard';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <LayoutPage className="overflow-hidden">{children}</LayoutPage>
          <NavBottom />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
