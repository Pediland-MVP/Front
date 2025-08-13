"use client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
// UI Imports
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { TableLayout, Input, ListMagnifyingGlassIcon } from "@/components/index";
import ContactsListPage from "./ContactsListPage";

export default function page() {
  const { setTools, setButtons, clearTools, clearButtons } = useHeaderFeatures((s) => ({
    setTools: s.setTools,
    setButtons: s.setButtons,
    clearTools: s.clearTools,
    clearButtons: s.clearButtons,
  }))

  const [search, setSearch] = useState<string>("");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const t = useTranslations("Contacts");

  useEffect(() => {
    setButtons(
      <button
        className="m-0 flex p-0"
        onClick={() => setIsSearchVisible((prev) => !prev)}
      >
        <ListMagnifyingGlassIcon size={26} className="text-foreground xl:hidden" />
      </button>,
    );
    setTools(
      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setSearch(e.target.value)}
        className={`text-foreground mt-2 border-none bg-blue-50 text-[15px] shadow-none transition-all duration-200 focus:bg-blue-50 xl:mt-0 xl:bg-white ${isSearchVisible ? "flex" : "hidden xl:flex"}`}
      />,
    );
    return () => {
      clearButtons();
      clearTools();
    };
  }, [isSearchVisible]);

  return (
    <TableLayout className="_contacts">
      <ContactsListPage />
    </TableLayout>
  );
}
