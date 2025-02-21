"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import ContentCycleTable from "./components/contentCycleTable";
import { useHeaderTools } from "../../components/context/headerToolsContext";
import Link from "next/link";
// UI Imports Here
import { Button } from "@/components/theme/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default function ContentCyclePage() {
  const t = useTranslations("Automations");

  const { setTools } = useHeaderTools();

  useEffect(() => {
    setTools(
      <Link href="/console/actions/content-cycle/add">
        <Button size={"sm"}>
          <span>{t("add")}</span>{" "}
          <Plus size={20} />
        </Button>
      </Link>
    );
    return () => {
      setTools(null)
    };
  }, []);

  return (
    <div className="_automation">
      <ContentCycleTable />
    </div>
  );
}
