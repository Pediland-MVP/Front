"use client";
import { useEffect, useState } from "react";
import ContactListCard from "./components/contactListCard";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { Input } from "@/components/theme/ui/input";
import { useHeaderFeatures } from "../components/context/headerFeaturesContext";
import {
  ListMagnifyingGlass,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";

export default function page() {
  const { setButtons, setTools } = useHeaderFeatures();
  const [search, setSearch] = useState<string>("");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false); // حالت نمایش اینپوت

  const t = useTranslations("Contacts");

  useEffect(() => {
    setButtons(
      <button
        className="flex p-0 m-0"
        onClick={() => setIsSearchVisible((prev) => !prev)}
      >
        <ListMagnifyingGlass size={26} className="text-foreground xl:hidden" />
      </button>
    );
    setTools(
      <Input
        type="search"
        placeholder={t("searchPlaceholder")}
        onChange={(e) => setSearch(e.target.value)}
        className={`border-none shadow-none mt-2 xl:mt-0 text-[15px] bg-blue-50 xl:bg-white focus:bg-blue-50 text-foreground transition-all duration-200 ${isSearchVisible ? "flex" : "hidden xl:flex"}`}
      />
    );
    return () => {
      setButtons(null);
      setTools(null);
    };
  }, [isSearchVisible]);

  return (
    <div className="_contacts">
      <ContactListCard search={search} setSearch={setSearch} />
    </div>
  );
}
