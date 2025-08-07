"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ProductListTable from "./components/productListTable";
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";

export default function Page() {
  const t = useTranslations("Products");

  const { setTools } = useHeaderFeatures();
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
      setTools(null);
    };
  }, []);

  return (
    <div className="_products overflow-auto">
      <ProductListTable />
    </div>
  );
}
