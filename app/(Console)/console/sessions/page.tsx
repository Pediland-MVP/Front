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
  const t = await getTranslations("Sessions");
  return (
    <div className="_automation">
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
