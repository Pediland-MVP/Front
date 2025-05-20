"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";
import { Button } from "@/components/theme/ui/button";
import { ExcelExportDirectsDrawer } from "./components/excelExportDirects.drawer";

export default function page() {
  const t = useTranslations("Directs");
  const { setButtons } = useHeaderFeatures()
  const [open, setOpen] = useState(false)

  useEffect(() => {

    setButtons([
      <Button onClick={() => setOpen(true)}>
        {t('ExcelExport.title')}
      </Button>
    ])

    return () => {
      setButtons([])
    }
  }, [])

  return (
    <div className="_orders">
      <ExcelExportDirectsDrawer onOpenChange={setOpen} open={open} />
    </div>
  );
}
