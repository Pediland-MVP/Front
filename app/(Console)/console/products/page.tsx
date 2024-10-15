import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";
import ProductListTable from "./components/productListTable";

export default function Page() {
  return (
    <div className="container mx-auto py-10 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لیست محصولات</h1>
        <Link href="/console/products/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> افزودن محصول جدید
          </Button>
        </Link>
      </div>
      <ProductListTable />
    </div>
  );
}
