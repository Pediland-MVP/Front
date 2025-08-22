// src/app/(Console)/contacts/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";

import {
  ContactsList,
  Input,
  LayoutTable,
  ListMagnifyingGlassIcon,
} from "@/components/index";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Page() {
  const t = useTranslations("Contacts");

  const { setTools, setButtons, clearTools, clearButtons } = useHeaderFeatures(
    (s) => ({
      setTools: s.setTools,
      setButtons: s.setButtons,
      clearTools: s.clearTools,
      clearButtons: s.clearButtons,
    }),
  );

  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const debouncedSearch = useDebouncedValue(search, 300);
  const normalized = debouncedSearch.trim();
  const effectiveSearch = normalized.length >= 2 ? normalized : "";

  const HeaderButton = useMemo(
    () => (
      <button
        type="button"
        className="m-0 flex p-0"
        onClick={() => setIsSearchVisible((prev) => !prev)}
        aria-label={t("toggleSearch")}
      >
        <ListMagnifyingGlassIcon
          size={26}
          className="text-foreground xl:hidden"
        />
      </button>
    ),
    [t],
  );

  const HeaderTools = useMemo(
    () => (
      <Input
        id="contacts-search-input"
        type="search"
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value.replace(/\s+/g, " "))}
        className={isSearchVisible ? "flex" : "hidden xl:flex"}
      />
    ),
    [t, search, isSearchVisible],
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
