import ContentCycleTable from "./components/contentCycleTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContentCyclePage() {
  return (
    <div className="_automation">
      <div className="_header flex justify-between items-center mb-4 h-9">
        <h1 className="text-xl font-bold">لیست اتوماسیون</h1>

        <div className="_tools">
          <Link href="/console/actions/content-cycle/add">
            <Button>
              افزودن <Plus className="mr-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <ContentCycleTable />
    </div>
  );
}
