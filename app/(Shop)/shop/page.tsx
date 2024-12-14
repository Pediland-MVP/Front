import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import ProductDetails from "./components/productDetails";
import ImageLoader from "@/components/theme/ui/imageLoader";

const CheckoutForm = dynamic(() => import("./components/checkoutForm"), {
  loading: () => <p>Loading form...</p>,
});

export default async function CheckoutPage() {
  const t = await getTranslations("Checkout");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <Suspense fallback={<ImageLoader />}>
          <ProductDetails />
        </Suspense>
        <CheckoutForm />
      </div>
    </div>
  );
}
