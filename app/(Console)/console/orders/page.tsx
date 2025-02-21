"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import OrderListCard from "./components/orderListCard";
import Header from "../components/header";

export default function page() {
  const [search, setSearch] = useState<string>("");
  const t = useTranslations("Orders");

  return (
    <div className="_orders">
      <OrderListCard search={search} setSearch={setSearch} />
    </div>
  );
}
