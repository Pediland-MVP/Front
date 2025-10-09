"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ExcelExportDirectsDrawer } from "./components/excelExportDirects.drawer";

import { Button } from "@components";

export default function page() {
  const t = useTranslations("Directs");
  const { setButtons, clearButtons } = useHeaderFeatures((s) => ({
    setButtons: s.setButtons,
    clearButtons: s.clearButtons,
  }));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setButtons([
      <Button size="md" onClick={() => setOpen(true)}>{t("ExcelExport.title")}</Button>,
    ]);

    return () => {
      clearButtons();
    };
  }, [setButtons, clearButtons]);

  return (
    <div className="_orders">
      <ExcelExportDirectsDrawer onOpenChange={setOpen} open={open} />
    </div>
  );
}
