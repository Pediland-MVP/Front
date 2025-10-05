// Refactored
"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AutomationsList,
  Button,
  LayoutTable,
  SearchInput,
  SearchToggleButton,
} from "@/components";
import { CircleFadingPlusIcon } from "lucide-react";

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
        <Button type="button" variant="outline" size={"sm"} asChild>
          <Link href="/automations/add">
            {t("add")}
            <CircleFadingPlusIcon />
          </Link>
        </Button>
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
