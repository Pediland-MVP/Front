"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import OrderListCard from "./components/orderListCard";
import { Button } from "@befroosh/ui";
import { ExcelExportOrdersDrawer } from "./components/excelExportOrders.drawer";
import { useHeaderFeatures } from "@befroosh/lib/stores/useHeaderFeatures";

export default function page() {
  const [search, setSearch] = useState<string>("");
  const t = useTranslations("Orders");
  const { setButtons, clearButtons } = useHeaderFeatures((s) => ({
    setButtons: s.setButtons,
    clearButtons: s.clearButtons,
  }))
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setButtons([
      <Button onClick={() => setOpen(true)} key={"ExcelExport.title"}>
        {t("ExcelExport.title")}
      </Button>,
    ]);

    return () => {
      clearButtons();
    };
  }, [setButtons, clearButtons]);

  return (
    <div className="_orders overflow-auto">
      <ExcelExportOrdersDrawer onOpenChange={setOpen} open={open} />
      <OrderListCard search={search} setSearch={setSearch} />
    </div>
  );
}
