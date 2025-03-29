import SessionsTable from "./components/sessions.table";
import { getTranslations } from "next-intl/server";
// Just UI Imports Below

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
