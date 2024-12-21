"use client";

import { Suspense, lazy } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Button } from "@/components/theme/ui/button";
import useSWR from "swr";
import { OrderNamespace } from "@/types/order";
import { fetcher } from "@/hooks/swr/fetcher";
import LoadingComponent from "./components/loadingComponent";
import { CustomerDetailsSkeleton } from "./components/customerDetail.skeleton";
import { CustomerAddressSkeleton } from "./components/customerAddress.skeleton";
import { PaymentSkeleton } from "./components/payment.skeleton";
import { ProductDetailsSkeleton } from "./components/productDetails.skeleton";
import ProductDetails from "./components/productDetails";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { GENDERS } from "@/app/constants/gender.constant";
import { REGEX_MOBILE } from "@/app/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

const CustomerDetails = dynamic(() => import("./components/customerDetails"), {
  loading: () => <CustomerDetailsSkeleton />,
  ssr: false,
});

const Address = dynamic(() => import("./components/customerAddress"), {
  loading: () => <CustomerAddressSkeleton />,
  ssr: false,
});

const PaymentDetails = dynamic(() => import("./components/payment"), {
  loading: () => <PaymentSkeleton />,
  ssr: false,
});

export const orderFormSchema = z.object({
  gender: z.enum(["male", "female"]),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
  email: z.string().email().nullable(),
  mobile: z.string().regex(REGEX_MOBILE, "Invalid mobile number").nullable(),
  state: z.string().min(1, "State is required").nullable(),
  city: z.string().min(1, "City is required").nullable(),
  address: z.string().min(1, "Address is required").nullable(),
  postalCode: z.string().min(1, "Postal code is required").nullable(),
});

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  const shopId = "ba4c3ff2-4b94-47a1-97c7-f041c73dbd49";
  const orderId = "c3d5d99e-cab2-4082-ad1d-16e67c04b926";
  const secret = "d7220ce2-8780-4be8-a95d-8f5dea9ff6cc";

  const {
    data: order,
    isLoading,
    error,
  } = useSWR<OrderNamespace.Order>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}`,
    fetcher
  );

  const form = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      gender: GENDERS[0],
      firstname: "",
      lastname: "",
      email: "",
      mobile: "",
      state: "",
      city: "",
      address: "",
      postalcode: "",
    },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        ...(order.lead.contact as unknown as Pick<
          OrderNamespace.Order["lead"]["contact"],
          | "gender"
          | "firstname"
          | "lastname"
          | "email"
          | "mobile"
          | "state"
          | "city"
          | "address"
          | "postalcode"
        >)
      })
    }
  }, [order])

  const onSubmit = () => {};

  if (error) return <div>Error loading order data</div>;

  return (
    <FormProvider {...form}>
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="_checkout bg-white border rounded-xl p-5 md:p-10">
          <div className="grid md:grid-cols-4 gap-10">
            <Suspense fallback={<ProductDetailsSkeleton />}>
              <ProductDetails orderQuantity={order?.orderProducts[0].quantity}  product={order?.orderProducts?.[0]?.product} />
            </Suspense>

            <Suspense fallback={<CustomerDetailsSkeleton />}>
              <CustomerDetails />
            </Suspense>

            <Suspense fallback={<CustomerAddressSkeleton />}>
              <Address />
            </Suspense>

            <Suspense fallback={<PaymentSkeleton />}>
              <PaymentDetails orderCardToCard={order?.orderCardToCard} />
            </Suspense>

            <Button type="submit" className="w-full">
              {t("paynow")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
