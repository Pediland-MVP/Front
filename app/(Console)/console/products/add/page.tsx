"use client";

import InstaDirectUi from "@/components/global/instaDirectUi";
import ProductForm from "../components/product.form";

export default function Page() {
  return (
    <div className="h-full flex gap-7">
      <div className="w-2/3 h-[calc(100vh-5rem)] bg-white shadow rounded-2xl p-4">
        <ProductForm />
      </div>
      <div className="w-1/3 h-[calc(100vh-5rem)] bg-white shadow rounded-2xl p-4">
        <InstaDirectUi />
      </div>
    </div>
  );
}
