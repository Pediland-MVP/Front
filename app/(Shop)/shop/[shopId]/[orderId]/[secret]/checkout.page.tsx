"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { ORDER_STATUS, OrderNamespace } from "@/types/order";
import { CustomerDetailsSkeleton } from "./components/customerDetail.skeleton";
import { CustomerAddressSkeleton } from "./components/customerAddress.skeleton";
import { PaymentSkeleton } from "./components/payment.skeleton";
import { ProductDetailsSkeleton } from "./components/productDetails.skeleton";
import ProductDetails from "./components/productDetails";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { REGEX_MOBILE } from "@/app/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { GENDERS_ENUM } from "@/app/constants/gender.constant";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { toast } from "@/components/ui/use-toast";
import { OrderSubmitButtonSkeleton } from "./components/orderSubmitButton.skeleton";
import { FloatingTimeCircleSkeleton } from "./components/floatingTimeCircle.skeleton";
import logger from "@/app/utils/logger";
import OrderNotfound from "./components/order.notfound";
import { fetcher2 } from "@/hooks/swr/fetcher2";
import { useRouter } from "next/navigation";
import OrderProcessing from "./components/order.processing";

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

const FloatingTimeCircle = dynamic(() => import("./components/floatingTimeCircle"), {
  loading: () => <FloatingTimeCircleSkeleton />,
  ssr: false,
})

const OrderSubmitButton = dynamic(
  () => import("./components/orderSubmitButton"),
  {
    loading: () => <OrderSubmitButtonSkeleton />,
    ssr: false,
  }
);

export const orderFormSchema = z.object({
  gender: z.nativeEnum(GENDERS_ENUM),
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().email(),
  mobile: z.string().regex(REGEX_MOBILE, "Invalid mobile number"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  postalcode: z.string().min(10, 'کد پستی باید ۱۰ رقمی باشد').max(10),
});

export type CheckoutProps = {
  shopId: string;
  orderId: string;
  secret: string
}

export default function CheckoutPage({ orderId, secret, shopId}: CheckoutProps) {
  const t = useTranslations("Checkout");
  const [isLoading, setIsLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false)


  const {
    data: order,
    isLoading: isLoadingOrder,
    error,
  } = useSWR<OrderNamespace.Order>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}`,
    fetcher2
  );

  const form = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      gender: GENDERS_ENUM.MALE,
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
        >),
      });
    }
  }, [order]);


  const onSubmit = async (values: z.infer<typeof orderFormSchema>) => {
    setIsLoading(true);
    await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${secret}/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      }
    )
      .then(async (res) => {
        const response = await res.json();
        if (!res.ok) {
          switch ((response as ExceptionMessage).code) {
            case "ORDER_CARD_TO_CARD_NOT_UPLOADED":
              toast({
                title: t("orderCardToCardNotUploaded"),
                variant: "destructive",
              });
              break;
          }
          return
        }
        setOrderCompleted(true)
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  switch((error?.data as ExceptionMessage)?.code) {
    case 'ORDER_INVALID':
      return <OrderNotfound/>
    case 'ORDER_EXPIRED' :
      return <OrderNotfound/>
    case "ORDER_NOT_FOUND":
      return <OrderNotfound/>
  }

  if (order?.status === ORDER_STATUS.PROCESSING) {
    return <OrderProcessing/>
  }

  if(orderCompleted) {
    return <OrderProcessing/>
  }

  return (
    <FormProvider {...form}>
      <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="_checkout bg-white border rounded-xl p-5 md:p-10">
          <div className="grid md:grid-cols-4 gap-10">
            <Suspense fallback={<ProductDetailsSkeleton />}>
              <ProductDetails
                orderDetails={{orderId, secret, shopId}}
                orderQuantity={order?.orderProducts[0].quantity}
                product={order?.orderProducts?.[0]?.product}
              />
            </Suspense>

            <Suspense fallback={<CustomerDetailsSkeleton />}>
              <CustomerDetails />
            </Suspense>

            <Suspense fallback={<CustomerAddressSkeleton />}>
              <Address />
            </Suspense>

            <Suspense fallback={<PaymentSkeleton />}>
              <PaymentDetails orderDetails={{orderId, secret, shopId}} orderCardToCard={order?.orderCardToCard} />
            </Suspense>

            <Suspense fallback={<FloatingTimeCircleSkeleton/>}>
              <FloatingTimeCircle startDateString={order?.createDate} />
            </Suspense>

            <Suspense fallback={<OrderSubmitButtonSkeleton />}>
              <OrderSubmitButton isLoading={isLoading} />
            </Suspense>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}