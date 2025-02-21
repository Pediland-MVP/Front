"use client";
import { useEffect, useState } from "react";
import ContactListCard from "./components/contactListCard";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { Input } from "@/components/theme/ui/input";
import { useHeaderTools } from "../components/context/headerToolsContext";

export default function page() {
  const [search, setSearch] = useState<string>("");
  const t = useTranslations("Contacts");

  const { setTools } = useHeaderTools();
  useEffect(() => {
    setTools(
      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 border-none shadow-none"
      />
    )
    return () => {
      setTools(null)
    }
  }, [])

  return (
    <div className="_contacts">
      <ContactListCard search={search} setSearch={setSearch} />
    </div>
  );
}
