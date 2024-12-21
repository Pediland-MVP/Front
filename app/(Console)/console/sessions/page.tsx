
import SessionsTable from "./components/sessions.table";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  const t = await getTranslations('Sessions')
  return (

    <div className="_automation">
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
                <BreadcrumbLink href="/console/actions/content-cycle">
                  {t("automation")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("title")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools">
        </div>
      </header>

      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
