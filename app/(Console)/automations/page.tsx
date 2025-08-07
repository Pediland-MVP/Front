// app/(Console)/automations/page.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";

// UI Imports
import { Button } from "@/components/theme/ui/button";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import ContentCycleTable from "./components/contentCycleTable";

export default function ContentCyclePage() {
  const t = useTranslations("Automations");
  const { setTools } = useHeaderFeatures();

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
      setTools(null);
    };
  }, []);

  return (
    <div className="_automation overflow-auto">
      <ContentCycleTable />
    </div>
  );
}
