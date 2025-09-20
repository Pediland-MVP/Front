"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ProductListTable from "./components/productListTable";
// Just UI Imports Below
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { useHeaderFeatures } from "@befroosh/lib/stores/useHeaderFeatures";

export default function Page() {
  const t = useTranslations("Products");

  const { setTools, clearTools } = useHeaderFeatures((s) => ({
    setTools: s.setTools,
    clearTools: s.clearTools,
  }))
  useEffect(() => {
    setTools(
      <Link href="/products/add">
        <Button size={"sm"} className="mt-3 xl:mt-0">
          {t("add")}
          <PlusIcon />
        </Button>
      </Link>,
    );
    return () => {
      clearTools();
    };
  }, [setTools, clearTools]);

  return (
    <div className="_products overflow-auto">
      <ProductListTable />
    </div>
  );
}
