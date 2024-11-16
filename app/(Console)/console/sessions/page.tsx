import Link from "next/link";
import SessionsTable from "./components/sessions.table";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default async function SessionsPage(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  return (
    <div className="container mx-auto py-10 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">سشن‌ها</h1>
        <Link href="/console/actions/content-cycle/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> افزودن چرخه جدید
          </Button>
        </Link>
      </div>
      <SessionsTable
        contentCycleId={(await props.searchParams).contentCycleId || undefined}
      />
    </div>
  );
}
