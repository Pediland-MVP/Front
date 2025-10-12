"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";

import { DashboardPage, LoaderSpin } from "@components";

export default function Page() {
  const t = useTranslations("Console");

  const { isLoading } = useUser();

  if (isLoading) {
    return <LoaderSpin />;
  }

  return <DashboardPage />;
}
