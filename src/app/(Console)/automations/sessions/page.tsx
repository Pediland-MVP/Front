import SessionsTable from "../../../../components/Sessions/sessions.table";
import { getTranslations } from "next-intl/server";
// Just UI Imports Below

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  const t = await getTranslations("Sessions");
  return (
    <div className="_automation overflow-auto">
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
