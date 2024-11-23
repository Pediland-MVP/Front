import { FC } from "react";
import { CommentsLayout } from "./components/commentsLayout";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations("Comments");
  return (
    <div className="_comment max-h-full overflow-hidden">
      <header className="px-4 pt-4 flex justify-between items-center gap-4">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/console">
                  {t("dashboard")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("list")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>

      <div className="p-4">
        <CommentsLayout>{children}</CommentsLayout>
      </div>
    </div>
  );
};

export default ChatsLayout;
