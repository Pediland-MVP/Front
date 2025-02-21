'use client'

import { FC, useEffect } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ConversationsList from "./components/conversationsList";
import { ConversationNamespace } from "@/types/conversations/conversation.namespace";
import { ConversationsProvider } from "./context/conversations.context";

type ChatsLayout = {
  children: React.ReactNode;
};

export type ConversationsContextType = {
  conversations: ConversationNamespace.WS.Conversations["items"];
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations("Inbox");
  return (
    <div className="_direct flex flex-col h-full max-h-full overflow-hidden">
      <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
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

      <div className="_chat-layout min-h-[calc(100vh-5.5rem)] w-full flex flex-col lg:flex-row overflow-auto">
        <ConversationsProvider>
          <ConversationsList />
          {children}
        </ConversationsProvider>
      </div>
    </div>
  );
};

export default ChatsLayout;
