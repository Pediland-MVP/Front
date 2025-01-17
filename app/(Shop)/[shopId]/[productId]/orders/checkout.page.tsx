"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { fetcher2 } from "@/hooks/swr/fetcher2";
import { REGEX_MOBILE } from "@/app/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { GENDERS_ENUM } from "@/app/constants/gender.constant";
import ProductDetails from "./components/productDetails";
import { CustomerDetailsSkeleton } from "./components/customerDetail.skeleton";
import { CustomerAddressSkeleton } from "./components/customerAddress.skeleton";
import { PaymentSkeleton } from "./components/payment.skeleton";
import { UploadTransactionSkeleton } from "./components/uploadTransaction.skeleton";
import { FloatingTimeCircleSkeleton } from "./components/floatingTimeCircle.skeleton";
import OrderNotfound from "./components/order.notfound";
import OrderProcessing from "./components/order.processing";
// UI
import { Card } from "@/components/theme/ui/card";
import {
  FormStep,
  FormStepperProvider,
} from "@/components/theme/ui/formStepper";
import {
  House,
  User,
  CreditCard,
  UploadSimple,
} from "@phosphor-icons/react/dist/ssr";
import { CheckoutContext } from "./useCheckout";
import useSWRImmutable from "swr/immutable";
import { ProductNamespace } from "@/types/product";
import { ShopNamespace } from "@/types/shops/shop.namespace";
import { ORDER_STATUS, OrderNamespace } from "@/types/order/order.namespace";


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

const FloatingTimeCircle = dynamic(
  () => import("./components/floatingTimeCircle"),
  {
    loading: () => <FloatingTimeCircleSkeleton />,
    ssr: false,
  }
);

const UploadTransaction = dynamic(
  () => import("./components/uploadTransaction"),
  {
    loading: () => <UploadTransactionSkeleton />,
    ssr: false,
  }
);

export const orderFormSchema = z.object({
  gender: z.nativeEnum(GENDERS_ENUM),
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().email(),
  mobile: z.string().regex(REGEX_MOBILE, "Invalid mobile number"),
  state: z.string(),
  cityId: z.string(),
  address: z.string().min(1, "Address is required"),
  postalcode: z.string().min(10, "کد پستی باید ۱۰ رقمی باشد").max(10),
});

export type CheckoutProps = {
  shopId: string;
  productId: string;
  token?: string;
};

export default function CheckoutPage({
  token,
  shopId,
  productId,
}: CheckoutProps) {
  const t = useTranslations("Checkout");
  const [isLoading, setIsLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [outOfStock, setOutOfStock] = useState(false)
  const [pendingOrder, setPendingOrder] =
    useState<OrderNamespace.GET.Pending>();

  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useSWRImmutable<ProductNamespace.PublicProduct>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${productId}`,
    fetcher2
  );

  const {
    data: lead,
    isLoading: isLoadingLead,
    error: errorLead,
  } = useSWRImmutable(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/leads/my/contact`,
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
      cityId: "",
      address: "",
      postalcode: "",
    },
  });

  useEffect(() => {
    if (lead) {
      const cityId = lead.contact.city?.id?.toString();
      const state = lead.contact.city?.province?.id?.toString();
      form.reset({
        ...lead.contact,
        ...(cityId && { cityId }),
        ...(state && { state }),
      });
    }
  }, [lead]);

  const {
    data: shop,
    isLoading: isLoadingShop,
    error: errorShop,
  } = useSWRImmutable<ShopNamespace.GET.Shop>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/shops/${shopId}`
  );

  const {
    data: _pendingOrder,
    isLoading: isLoadingPendingOrder,
    error: errorPendingOrder,
  } = useSWRImmutable<OrderNamespace.GET.Pending>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/pending`
  );
  useEffect(() => {
    if (_pendingOrder) {
      console.log("pendingOrder", pendingOrder);

      if (_pendingOrder.orderProducts?.length > 0) {
        const orderProduct = _pendingOrder.orderProducts[0];
        if (orderProduct.quantity) {
          setQuantity(orderProduct.quantity);
        }
      }

      setCurrentStep(_pendingOrder.step);
      setPendingOrder(_pendingOrder);
    }
  }, [_pendingOrder]);

  useEffect(() => {
    console.log(form.getValues());
  }, [form.watch]);
  // useEffect(() => {
  //   if (order) {
  //     form.reset({
  //       ...(order.lead.contact as unknown as Pick<
  //         OrderNamespace.Order["lead"]["contact"],
  //         | "gender"
  //         | "firstname"
  //         | "lastname"
  //         | "email"
  //         | "mobile"
  //         | "state"
  //         | "city"
  //         | "address"
  //         | "postalcode"
  //       >),
  //     });
  //   }
  // }, [order]);

  const onSubmit = async (values: z.infer<typeof orderFormSchema>) => {
    // setIsLoading(true);
    // await fetch(
    //   `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${token}/process`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     credentials: "include",
    //     body: JSON.stringify(values),
    //   }
    // )
    //   .then(async (res) => {
    //     const response = await res.json();
    //     if (!res.ok) {
    //       switch ((response as ExceptionMessage).code) {
    //         case "ORDER_CARD_TO_CARD_NOT_UPLOADED":
    //           toast({
    //             title: t("orderCardToCardNotUploaded"),
    //             variant: "destructive",
    //           });
    //           break;
    //       }
    //       return;
    //     }
    //     setOrderCompleted(true);
    //   })
    //   .finally(() => {
    //     setIsLoading(false);
    //   });
  };

  switch ((productError?.data as ExceptionMessage)?.code) {
    case "ORDER_INVALID":
      return <OrderNotfound />;
    case "ORDER_EXPIRED":
      return <OrderNotfound />;
    case "ORDER_NOT_FOUND":
      return <OrderNotfound />;
  }

  // if (order?.status === ORDER_STATUS.PROCESSING) {
  //   return <OrderProcessing />;
  // }

  if (pendingOrder && (pendingOrder?.status !== ORDER_STATUS.PENDING && pendingOrder?.status !== ORDER_STATUS.PAYMENT)) {
    return <OrderProcessing />;
  }

  return (
    <CheckoutContext.Provider
      value={{
        token,
        shopId,
        productId,
        product,
        step: currentStep,
        setStep: setCurrentStep,
        orderQuantity: quantity,
        setOrderQuantity: setQuantity,
        pendingOrder,
        setPendingOrder,
        // orderId,
        // order
        // setOrderId,
        outOfStock,
        setOutOfStock,
        shop,
      }}
    >
      <FormProvider {...form}>
        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
          <Suspense fallback={<FloatingTimeCircleSkeleton />}>
            {/* <FloatingTimeCircle startDateString={order?.createDate} /> */}
          </Suspense>
          <Card className="_checkout border rounded-xl p-0 md:p-10">
            <ProductDetails />
            <FormStepperProvider
              className="mt-5"
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
            >
              <FormStep
                disableTitle
                step={1}
                icon={<User className="w-6 h-6" />}
                title="اطلاعات شخصی"
              >
                <Suspense fallback={<CustomerDetailsSkeleton />}>
                  <CustomerDetails />
                </Suspense>
              </FormStep>

              <FormStep
                disableTitle
                step={2}
                icon={<House className="w-6 h-6" />}
                title="آدرس"
              >
                <Suspense fallback={<CustomerAddressSkeleton />}>
                  <Address />
                </Suspense>
              </FormStep>

              <FormStep
                disableTitle
                step={3}
                icon={<CreditCard className="w-6 h-6" />}
                title="پرداخت"
              >
                <Suspense fallback={<PaymentSkeleton />}>
                  <PaymentDetails />
                </Suspense>
              </FormStep>

              <FormStep
                disableTitle
                step={4}
                icon={<UploadSimple className="w-6 h-6" />}
                title="آپلود مدارک"
              >
                <Suspense fallback={<UploadTransactionSkeleton />}>
                  <UploadTransaction/>
                </Suspense>
              </FormStep>
            </FormStepperProvider>
          </Card>
        </form>
      </FormProvider>
    </CheckoutContext.Provider>
  );
}
