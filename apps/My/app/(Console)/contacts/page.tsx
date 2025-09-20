// src/app/(Console)/contacts/page.tsx
"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  ContactsList,
  LayoutTable,
  SearchInput,
  SearchToggleButton,
} from "@befroosh/ui";

export default function Page() {
  const t = useTranslations("Contacts");

  const { setTools, setButtons, clearTools, clearButtons } = useHeaderFeatures(
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

  const HeaderButton = useMemo(
    () => <SearchToggleButton setIsSearchVisible={setIsSearchVisible} />,
    [],
  );

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
    <LayoutTable className="_contacts">
      <ContactsList search={effectiveSearch} />
    </LayoutTable>
  );
}
