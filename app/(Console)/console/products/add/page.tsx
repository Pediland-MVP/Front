"use client";

import InstaDirectUi from "@/components/global/instaDirectUi";
import ProductForm from "../components/product.form";

export default function Page() {
  return (
    <div className="_products">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">جزئیات کالا / خدمت</h1>

        <div className="_tools"></div>
      </div>
      <ProductForm />
    </div>
  );
}
