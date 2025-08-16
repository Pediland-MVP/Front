// src/app/(Console)/contacts/page.tsx
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";

import {
  ContactsList,
  Input,
  ListMagnifyingGlassIcon,
  TableLayout,
} from "@/components/index";

export default function page() {
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
  const t = useTranslations("Contacts");

  useEffect(() => {
    setButtons(
      <button
        className="m-0 flex p-0"
        onClick={() => setIsSearchVisible((prev) => !prev)}
      >
        <ListMagnifyingGlassIcon
          size={26}
          className="text-foreground xl:hidden"
        />
      </button>,
    );
    setTools(
      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setSearch(e.target.value)}
        className={`${isSearchVisible ? "flex" : "hidden xl:flex"}`}
      />,
    );
    return () => {
      clearButtons();
      clearTools();
    };
  }, [isSearchVisible]);

  return (
    <TableLayout className="_contacts">
      <ContactsList search={search} />
    </TableLayout>
  );
}
