import React from "react";
import ContactListCard from "./components/contactListCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";

export default function page() {
  return (
    <div className="_products">
      <div className="_header flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لیست ارتباطات</h1>

        <div className="_buttons"></div>
      </div>
      <ContactListCard />
    </div>
  );
}
