"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";

import {
  Button,
  LayoutTable,
  SearchInput,
  SearchToggleButton,
} from "@/components/index";
import ContentCycleTable from "../../../components/Automations/contentCycleTable";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { AutomationsList } from "@/components/Automations/AutomationsList";

export default function Page() {
  const t = useTranslations("Automations");

  const { setTools, clearTools, setButtons, clearButtons } = useHeaderFeatures(
    (s) => ({
      setTools: s.setTools,
      clearTools: s.clearTools,
      setButtons: s.setButtons,
      clearButtons: s.clearButtons,
    }),
  );

  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebounce(search, 300);
  const normalized = debouncedSearch.trim();
  const effectiveSearch = normalized.length >= 2 ? normalized : "";

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />

        <Link href="/automations/add">
          <Button size={"sm"}>
            {t("add")}
            <PlusIcon />
          </Button>
        </Link>
      </>
    );
  }, [isSearchVisible, setIsSearchVisible]);

  const HeaderTools = useMemo(
    () => (
      <SearchInput
        value={search}
        onChange={setSearch}
        visible={isSearchVisible}
      />
    ),
    [search, isSearchVisible, setSearch],
  );

  useEffect(() => {
    setButtons(HeaderButton);
    setTools(HeaderTools);

    return () => {
      clearButtons();
      clearTools();
    };
  }, [
    HeaderButton,
    HeaderTools,
    setButtons,
    setTools,
    clearButtons,
    clearTools,
  ]);

  return (
    <LayoutTable className="_automation overflow-auto">
      <AutomationsList />
    </LayoutTable>
  );
}
