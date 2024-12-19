import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import ProductDetails from "./components/productDetails";
import CustomerDetails from "./components/customerDetails";
import ImageLoader from "@/components/theme/ui/imageLoader";
import Address from "./components/customerAddress";
import PaymentDetails from "./components/payment";
import { Button } from "@/components/theme/ui/button";

const CheckoutForm = dynamic(() => import("./components/customerDetails"), {
  loading: () => <p>Loading form...</p>,
});

export default async function CheckoutPage() {
  const t = await getTranslations("Checkout");

  return (
    <div className="_checkout bg-white border rounded-xl p-5 md:p-10">
      <div className="grid md:grid-cols-4 gap-10">
        <Suspense fallback={<ImageLoader />}>
          <ProductDetails />
        </Suspense>

        <CustomerDetails />

        <Address />

        <PaymentDetails />

        <Button type="submit" className="w-full">
          {t("paynow")}
        </Button>
      </div>
    </div>
  );
}
