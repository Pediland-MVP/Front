import { isUUID } from "class-validator";
import { redirect } from "next/navigation";
import ContentCycle from "../components/contentCycle";
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

type ContentCycleEditPageProps = {
  params: {
    id: string;
  };
};
export default function ContentCycleEditPage({
  params: { id },
}: ContentCycleEditPageProps) {
  if (!isUUID(id, "4")) {
    redirect("/console/actions/content-cycle");
  }
  const t = useTranslations("Automations");

  return (
    <div className="_add-automation">
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
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/console/actions/content-cycle">
                  {t("list")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem className="sm:hidden">
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("addTitle")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>
      
      <div className="p-4">
        <ContentCycle id={id} />
      </div>
    </div>
  );
}
