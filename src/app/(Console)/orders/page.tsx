"use client";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button, OrdersListCard } from "@components";
import { DownloadIcon } from "lucide-react";
import { ExcelExportOrdersDrawer } from "./components/excelExportOrders.drawer";

export default function page() {
  const [search, setSearch] = useState<string>("");
  const t = useTranslations("Orders");
  const { setButtons, clearButtons } = useHeaderFeatures((s) => ({
    setButtons: s.setButtons,
    clearButtons: s.clearButtons,
  }));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setButtons([
      <Button size="md" onClick={() => setOpen(true)} key={"ExcelExport.title"}>
        {t("ExcelExport.title")}
        <DownloadIcon />
      </Button>,
    ]);

    return () => {
      clearButtons();
    };
  }, [setButtons, clearButtons]);

  return (
    <div className="_orders flex flex-col h-full overflow-auto">
      <ExcelExportOrdersDrawer onOpenChange={setOpen} open={open} />

      <OrdersListCard search={search} setSearch={setSearch} />
    </div>
  );
}
