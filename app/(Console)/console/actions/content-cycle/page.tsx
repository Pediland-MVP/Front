import ContentCycleTable from "./components/contentCycleTable";
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

export default function ContentCyclePage() {
  const t = useTranslations("Automations");
  return (
    <div className="_automation">
      <header className="px-4 pt-4 h-14 flex justify-between items-center gap-4">
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

        <div className="_tools">
          <Link href="/console/actions/content-cycle/add">
            <Button size={"sm"}>
              <span className="hidden sm:inline">{t("add")}</span>{" "}
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4">
        <ContentCycleTable />
      </div>
    </div>
  );
}
