'use client'
import { useState } from "react";
import ContactListCard from "./components/contactListCard";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

export default function page() {

  const [search, setSearch] = useState<string>("")
  const t = useTranslations('Contacts')

  return (
    <div className="_products">
      <div className="_header flex justify-between items-center mb-4 h-9">
        <h1 className="text-xl font-bold">{t('list')}</h1>

        <div className="_tools">
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
      <ContactListCard search={search} setSearch={setSearch} />
    </div>
  );
}
