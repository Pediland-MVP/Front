import ContentCycleTable from "./components/contentCycleTable";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContentCyclePage() {
    return (
        <div className="container mx-auto py-10 rtl" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">چرخه محتوا</h1>
                <Link href="/console/actions/content-cycle/add">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> افزودن چرخه جدید
                    </Button>
                </Link>
            </div>
            <ContentCycleTable />
        </div>
    )
}
