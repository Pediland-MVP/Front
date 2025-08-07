"use client";

import ProductForm from "../components/product.form";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("Products");

  return (
    <div className="_add-product h-full overflow-auto">
      <ProductForm />
    </div>
  );
}
