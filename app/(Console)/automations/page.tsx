"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ContentCycleTable from "./components/contentCycleTable";
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";
import Link from "next/link";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default function ContentCyclePage() {
  const t = useTranslations("Automations");

  const { setTools } = useHeaderFeatures();

  useEffect(() => {
    setTools(
      <Link href="/automations/add">
        <Button size={"sm"} className="mt-3 xl:mt-0">
          {t("add")}
          <Plus />
        </Button>
      </Link>
    );
    return () => {
      setTools(null);
    };
  }, []);

  return (
    <div className="_automation">
      <ContentCycleTable />
    </div>
  );
}
