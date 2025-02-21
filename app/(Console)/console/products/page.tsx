"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ProductListTable from "./components/productListTable";
import { useHeaderTools } from "../components/context/headerToolsContext";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default function Page() {
  const t = useTranslations('Products')

  const { setTools } = useHeaderTools();
  useEffect(() => {
    setTools(<Link href="/console/products/add">
      <Button size={"sm"}>
        <span className="hidden sm:inline"> {t('add')}</span>{" "}
        <Plus size={20} />
      </Button>
    </Link>);
    return () => {
      setTools(null)
    };
  }, []);

  return (
    <div className="_products">
      <ProductListTable />
    </div>
  );
}
