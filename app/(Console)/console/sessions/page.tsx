
import { useTranslations } from "next-intl";
import SessionsTable from "./components/sessions.table";
import { getTranslations } from "next-intl/server";

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  const t = await getTranslations('Sessions')
  return (
    <div className="container mx-auto py-10 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
