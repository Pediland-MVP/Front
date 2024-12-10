import { FC } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Breadcrumb, BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/theme/ui/breadcrumb";
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ConversationsList from "./components/conversationsList";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations("Inbox");

  return (
    <div className="_direct flex flex-col h-full max-h-full overflow-hidden">
      <header className="hidden lg:flex px-4 pt-4 justify-between items-center gap-4">
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

      <div className="flex h-full w-full lg:p-4 box-border">
        <div className="_chat-layout h-full w-full flex flex-col lg:flex-row gap-5 overflow-auto">
          <ConversationsList />
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChatsLayout;
