"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import ProductListTable from "./components/productListTable";

import { Button } from "@/components/ui/button";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { CircleFadingPlusIcon } from "lucide-react";

export default function Page() {
  const t = useTranslations("Products");

  const { setButtons, clearButtons } = useHeaderFeatures((s) => ({
    setButtons: s.setButtons,
    clearButtons: s.clearButtons,
  }));

  const HeaderButton = useMemo(() => {
    return (
      <Button size="md" asChild>
        <Link href="/products/add">
          {t("add")}
          <CircleFadingPlusIcon />
        </Link>
      </Button>
    );
  }, []);

  useEffect(() => {
    setButtons(HeaderButton);

    return () => {
      clearButtons();
    };
  }, [HeaderButton, setButtons, clearButtons]);

  return (
    <div className="_products flex h-full flex-col overflow-auto">
      <ProductListTable />
    </div>
  );
}
