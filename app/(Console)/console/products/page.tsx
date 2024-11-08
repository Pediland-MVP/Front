import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React from "react";
import ProductListTable from "./components/productListTable";

export default function Page() {
  return (
    <div className="_products">
      <div className="_header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لیست محصولات</h1>

        <div className="_buttons">
          <Link href="/console/products/add">
            <Button>
              افزودن محصول جدید <Plus className="mr-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <ProductListTable />
    </div>
  );
}
