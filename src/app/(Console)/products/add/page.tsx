"use client";

import { useSearchParams } from "next/navigation";
import { LayoutPage } from "@/components/Layout/LayoutPage";
import ProductForm from "../../../../components/Products/ProductForm";

export default function Page() {
  const searchParams = useSearchParams();
  const type = searchParams.get("t") as "p" | "v";

  return (
    <LayoutPage>
      <ProductForm type={type} />
    </LayoutPage>
  );
}
