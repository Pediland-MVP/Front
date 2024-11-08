'use client'
import { useState } from "react";
import ContactListCard from "./components/contactListCard";
import { Input } from "@/components/ui/input";

export default function page() {

  const [search, setSearch] = useState<string>("")

  return (
    <div className="_products">
      <div className="_header flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">لیست ارتباطات</h1>

        <div className="_tools">
          <Input
            type="search"
            placeholder="جستجو ..."
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
