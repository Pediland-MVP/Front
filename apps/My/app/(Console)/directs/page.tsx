"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { Button } from "@/components/ui/button";
import { ExcelExportDirectsDrawer } from "./components/excelExportDirects.drawer";
import { useHeaderFeatures } from "@befroosh/lib/stores/useHeaderFeatures";

export default function page() {
  const t = useTranslations("Directs");
  const { setButtons, clearButtons } = useHeaderFeatures((s) => ({
    setButtons: s.setButtons,
    clearButtons: s.clearButtons,
  }))
  const [open, setOpen] = useState(false)

  useEffect(() => {

    setButtons([
      <Button onClick={() => setOpen(true)}>
        {t('ExcelExport.title')}
      </Button>
    ])

    return () => {
      clearButtons()
    }
  }, [setButtons, clearButtons])

  return (
    <div className="_orders">
      <ExcelExportDirectsDrawer onOpenChange={setOpen} open={open} />
    </div>
  );
}
