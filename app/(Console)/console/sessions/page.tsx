import SessionsTable from "./components/sessions.table";

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  return (
    <div className="container mx-auto py-10 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">سشن‌ها</h1>
      </div>
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
