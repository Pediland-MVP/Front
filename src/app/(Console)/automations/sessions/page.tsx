import { getTranslations } from "next-intl/server";

import { LayoutTable } from "@/components/Layout/LayoutTable";
import SessionsTable from "@/components/Sessions/sessions.table";

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  const t = await getTranslations("Sessions");
  return (
    <LayoutTable className="_sessions">
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </LayoutTable>
  );
}
