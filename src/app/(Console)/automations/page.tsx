// app/(Console)/automations/page.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

// UI Imports
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import ContentCycleTable from "./components/contentCycleTable";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";

export default function ContentCyclePage() {
  const t = useTranslations("Automations");
  const { setTools, clearTools } = useHeaderFeatures((s) => ({
    setTools: s.setTools,
    clearTools: s.clearTools,
  }));

  useEffect(() => {
    setTools(
      <Link href="/automations/add">
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
    <div className="_automation overflow-auto">
      <ContentCycleTable />
    </div>
  );
}
