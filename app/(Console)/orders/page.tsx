"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import OrderListCard from "./components/orderListCard";
import Header from "../components/header";
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";
import { Button } from "@/components/theme/ui/button";
import { ExcelExportOrdersDrawer } from "./components/excelExportOrders.drawer";

export default function page() {
  const [search, setSearch] = useState<string>("");
  const t = useTranslations("Orders");
  const { setButtons } = useHeaderFeatures();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setButtons([
      <Button onClick={() => setOpen(true)} key={"ExcelExport.title"}>
        {t("ExcelExport.title")}
      </Button>,
    ]);

    return () => {
      setButtons([]);
    };
  }, []);

  return (
    <div className="_orders overflow-auto">
      <ExcelExportOrdersDrawer onOpenChange={setOpen} open={open} />
      <OrderListCard search={search} setSearch={setSearch} />
    </div>
  );
}
