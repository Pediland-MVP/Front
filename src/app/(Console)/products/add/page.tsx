"use client";

import { Layout } from "lucide-react";
import ProductForm from "../components/product.form";
import { useTranslations } from "next-intl";
import { LayoutPage } from "@/components";

export default function Page() {
  const t = useTranslations("Products");

  return (
    <LayoutPage className="_add-product !p-0">
      <ProductForm />
    </LayoutPage>
  );
}
