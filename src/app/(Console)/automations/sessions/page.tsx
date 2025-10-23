import { LayoutTable } from "@/components";
import SessionsTable from "../../../../components/Sessions/sessions.table";
import { getTranslations } from "next-intl/server";
// Just UI Imports Below

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
