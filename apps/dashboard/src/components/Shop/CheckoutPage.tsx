'use client';

import { Suspense, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect } from 'react';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { fetcher2 } from '@/hooks/swr/fetcher2';
import { REGEX_MOBILE } from '@/utils/regex';
import { zodResolver } from '@hookform/resolvers/zod';
import { GENDERS_ENUM } from '@/constants/gender.constant';
import ProductDetails from '../../app/(Shop)/[shopId]/[productId]/order/components/productDetails';
import { CustomerDetailsSkeleton } from '../../app/(Shop)/[shopId]/[productId]/order/components/customerDetail.skeleton';
import { CustomerAddressSkeleton } from '../../app/(Shop)/[shopId]/[productId]/order/components/customerAddress.skeleton';
import { PaymentSkeleton } from '../../app/(Shop)/[shopId]/[productId]/order/components/payment.skeleton';
import { UploadTransactionSkeleton } from '../../app/(Shop)/[shopId]/[productId]/order/components/uploadTransaction.skeleton';
import { FloatingTimeCircleSkeleton } from '../../app/(Shop)/[shopId]/[productId]/order/components/floatingTimeCircle.skeleton';
import OrderNotfound from '../../app/(Shop)/[shopId]/[productId]/order/components/order.notfound';
import OrderProcessing from '../../app/(Shop)/[shopId]/[productId]/order/components/order.processing';
// UI
import { Card } from '@/components/ui/card';
import { FormStep, FormStepperProvider } from '@/components/ui/formStepper';
import { HouseIcon } from '@phosphor-icons/react/dist/ssr/House';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr/UploadSimple';
import { CheckoutContext } from '../../app/(Shop)/[shopId]/[productId]/order/useCheckout';
import useSWRImmutable from 'swr/immutable';
import { ProductNamespace } from '@/types/product';
import { ShopNamespace } from '@/types/shops/shop.namespace';
import { ORDER_STATUS, OrderNamespace } from '@/types/order/order.namespace';
import UnAuthorized from '../../app/(Shop)/[shopId]/[productId]/order/components/unAuthorized';
import Image from 'next/image';
import { ORDER_PAYMENT_METHODS } from '@/types/order/order.enum';
import CheckoutError from '../../app/(Shop)/[shopId]/[productId]/order/components/checkout.error';
import useSWR, { mutate } from 'swr';
import { MAX_PAYMENT_LIFE_TIME_IN_SEC } from '@/config/configs';
import { toast } from 'sonner';
import { ProductFieldTypeEnum } from '@/types/product.enum';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

const CustomerDetails = dynamic(
  () => import('../../app/(Shop)/[shopId]/[productId]/order/components/customerDetails'),
  {
    loading: () => <CustomerDetailsSkeleton />,
    ssr: false,
  },
);

const Address = dynamic(
  () => import('../../app/(Shop)/[shopId]/[productId]/order/components/customerAddress'),
  {
    loading: () => <CustomerAddressSkeleton />,
    ssr: false,
  },
);

const PaymentDetails = dynamic(
  () => import('../../app/(Shop)/[shopId]/[productId]/order/components/payment'),
  {
    loading: () => <PaymentSkeleton />,
    ssr: false,
  },
);

const FloatingTimeCircle = dynamic(
  () => import('../../app/(Shop)/[shopId]/[productId]/order/components/floatingTimeCircle'),
  {
    loading: () => <FloatingTimeCircleSkeleton />,
    ssr: false,
  },
);

const UploadTransaction = dynamic(
  () => import('../../app/(Shop)/[shopId]/[productId]/order/components/uploadTransaction'),
  {
    loading: () => <UploadTransactionSkeleton />,
    ssr: false,
  },
);

export const orderFormSchema = z.object({
  gender: z.nativeEnum(GENDERS_ENUM),
  firstname: z.string().min(1, 'نام خود را وارد کنید.'),
  lastname: z.string().min(1, 'نام خانوادگی خود را وارد کنید.'),
  email: z.string().email('ایمیل خود را وارد کنید.'),
  mobile: z.string().regex(REGEX_MOBILE, 'شماره موبایل خود را وارد کنید.'),
  state: z.string(),
  cityId: z.string(),
  address: z.string().min(1, 'آدرس خود را وارد کنید.'),
  postalcode: z.string().min(10, 'کد پستی باید ۱۰ رقمی باشد').max(10),
  productFieldValues: z
    .array(
      z.object({
        value: z.string().optional(),
        id: z.string().uuid(),
        isRequired: z.boolean(),
        label: z.string(),
        type: z.nativeEnum(ProductFieldTypeEnum),
        fieldId: z.string().uuid(),
      }),
    )
    .optional(),
  attributeValueIds: z.array(z.number()),
});

export type CheckoutProps = {
  shopId: string;
  productId: string;
  token?: string;
};

export const CheckoutPage = ({ token, shopId, productId }: CheckoutProps) => {
  const t = useTranslations('Checkout');
  const [paymentMethod, setPaymentMethod] = useState<ORDER_PAYMENT_METHODS>();
  const [outOfStock, setOutOfStock] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [isStepInitilized, setIsStepInitilized] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderNamespace.GET.Pending>();
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_PAYMENT_LIFE_TIME_IN_SEC); // Initialize with 1 hour in seconds

  const {
    data: _pendingOrder,
    isLoading: isLoadingPendingOrder,
    error: errorPendingOrder,
  } = useSWR<OrderNamespace.GET.Pending>(`${API_URL}/orders/pending`, {
    refreshInterval: 30_000,
  });

  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useSWRImmutable<ProductNamespace.PublicProduct>(`${API_URL}/products/${productId}`, fetcher2);

  const {
    data: lead,
    isLoading: isLoadingLead,
    error: errorLead,
  } = useSWRImmutable(`${API_URL}/leads/my/contact`, fetcher2);

  useEffect(() => {
    if (errorLead) {
      if (errorLead.data) {
        if (errorLead.data.statusCode === 401) {
          setIsUnauthorized(true);
        }
      }
    }
  }, [errorLead]);

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      gender: GENDERS_ENUM.MALE,
      firstname: '',
      lastname: '',
      email: '',
      mobile: '',
      state: '',
      cityId: '',
      address: '',
      postalcode: '',
      productFieldValues: [],
      attributeValueIds: [],
    },
  });

  useEffect(() => {
    if (lead) {
      const cityId = lead.contact.city?.id?.toString();
      const state = lead.contact.city?.province?.id?.toString();
      form.reset({
        ...form.getValues(),
        ...lead.contact,
        ...(cityId && { cityId }),
        ...(state && { state }),
      });
    }
  }, [lead]);

  const isProductFieldsInitialized = useRef(false);
  useEffect(() => {
    // Load field values
    if (!product) return;
    if (isLoadingPendingOrder) return;
    if (isProductFieldsInitialized.current === true) return;
    if ((form.getValues('productFieldValues')?.length || 0) > 0) return;

    const productFieldsTemp = product.fields.map((f, index) => {
      const pendingFieldValue = _pendingOrder?.productFieldValues?.find((v) => v.fieldId === f.id);

      return { ...f, value: pendingFieldValue?.value ?? '', fieldId: f.id };
    });
    form.setValue('productFieldValues', productFieldsTemp);
    isProductFieldsInitialized.current = true;
  }, [product, _pendingOrder, isLoadingPendingOrder]);

  const {
    data: shop,
    isLoading: isLoadingShop,
    error: shopError,
  } = useSWRImmutable<ShopNamespace.GET.Shop>(`${API_URL}/shops/${shopId}`);

  useEffect(() => {
    if (shop) {
      if (shop.workspace.paymentDetail?.zarinpal && !shop.workspace.paymentDetail?.cardToCard) {
        setPaymentMethod(ORDER_PAYMENT_METHODS.ZARINPAL);
        return;
      }
      if (!shop.workspace.paymentDetail?.zarinpal && shop.workspace.paymentDetail?.cardToCard) {
        setPaymentMethod(ORDER_PAYMENT_METHODS.CARD_TO_CARD);
        return;
      }
      //Defautl payment method
      setPaymentMethod(ORDER_PAYMENT_METHODS.ZARINPAL);
    }
  }, [shop]);

  useEffect(() => {
    const orderCancleHandler = async () => {
      await mutate((key) => typeof key === 'string' && key.includes('pending'));
      toast.error('مدت زمان سفارش شما منقضی شد', {
        description: 'لطفا مجددا سفارش دهید',
      });
      setCurrentStep(1);
      setTimeLeft((old) => {
        return MAX_PAYMENT_LIFE_TIME_IN_SEC;
      });
    };

    if (timeLeft === 0) {
      orderCancleHandler();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!_pendingOrder && currentStep > 1) {
      setCurrentStep(1);
    }

    // if (currentStep === 1) {
    //   setCurrentStep(_pendingOrder?.step || 1)
    // }

    if (_pendingOrder) {
      setPendingOrder(_pendingOrder);

      if (
        _pendingOrder.orderProducts?.length > 0 &&
        _pendingOrder?.orderProducts[0]?.product?.id !== product?.id
      ) {
        // This is another product
        return;
      }

      if (
        _pendingOrder.orderProducts?.length > 0 &&
        _pendingOrder.orderProducts[0].product.id === product?.id
      ) {
        const orderProduct = _pendingOrder.orderProducts[0];
        if (orderProduct.quantity) {
          setQuantity(orderProduct.quantity);
        }
      }

      if (!isStepInitilized) {
        setCurrentStep(_pendingOrder.step);
        setIsStepInitilized(true);
      }
    }
  }, [_pendingOrder, currentStep, product]);

  useEffect(() => {
    if (errorPendingOrder) setPendingOrder(undefined);
  }, [errorPendingOrder]);

  switch ((productError?.data as ExceptionMessage)?.code) {
    case 'ORDER_INVALID':
      return <OrderNotfound />;
    case 'ORDER_EXPIRED':
      return <OrderNotfound />;
    case 'ORDER_NOT_FOUND':
      return <OrderNotfound />;
  }

  if (shopError || productError) {
    return <CheckoutError />;
  }

  // if (order?.status === ORDER_STATUS.PROCESSING) {
  //   return <OrderProcessing />;
  // }

  // Specified in useProcessOrder in uploadTransaction
  if (isCompleted) {
    return <OrderProcessing />;
  }

  if (isUnauthorized) {
    return <UnAuthorized />;
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
        outOfStock,
        setOutOfStock,
        shop,
        isCompleted,
        setIsCompleted,
        paymentMethod,
        setPaymentMethod,
        timeLeft,
        setTimeLeft,
      }}
    >
      <header className="py-2 md:py-3">
        <div className="_logo flex items-center gap-3">
          <Image
            src={shop?.profilePicture?.url || '/images/befroosh-logo.svg'}
            alt="logo"
            width={46}
            height={46}
            className="rounded-md"
          />
          <span className="text-secondary text-lg font-bold">{shop?.name}</span>
        </div>
      </header>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(() => {})}>
          {/* {product && pendingOrder && (
            <OrderConfirmationDrawer
              product={product}
              pendingOrder={pendingOrder}
              onCancelOrder={() => {}}
              onCreateNewOrder={() => {}}
            />
          )} */}

          <Card className="_checkout p-0 md:p-5">
            <ProductDetails />

            <FormStepperProvider
              setCurrentStep={setCurrentStep}
              currentStep={currentStep}
              disableNavigation
              // Temporary disabled
              disable={true}
            >
              <FormStep
                disableTitle
                step={1}
                icon={<UserIcon className="h-6 w-6" />}
                title="اطلاعات شخصی"
              >
                <Suspense fallback={<CustomerDetailsSkeleton />}>
                  <CustomerDetails />
                </Suspense>
              </FormStep>

              <FormStep disableTitle step={2} icon={<HouseIcon className="h-6 w-6" />} title="آدرس">
                <Suspense fallback={<CustomerAddressSkeleton />}>
                  <Address />
                </Suspense>
              </FormStep>

              <FormStep
                disableTitle
                step={3}
                icon={<CreditCardIcon className="h-6 w-6" />}
                title="پرداخت"
              >
                <Suspense fallback={<PaymentSkeleton />}>
                  <PaymentDetails />
                </Suspense>
              </FormStep>

              <FormStep
                disableTitle
                step={4}
                icon={<UploadSimpleIcon className="h-6 w-6" />}
                title="آپلود مدارک"
              >
                <Suspense fallback={<UploadTransactionSkeleton />}>
                  <UploadTransaction />
                </Suspense>
              </FormStep>
            </FormStepperProvider>

            <Suspense fallback={<FloatingTimeCircleSkeleton />}>
              {pendingOrder?.status === ORDER_STATUS.PAYMENT && pendingOrder.startPaymentDate && (
                <FloatingTimeCircle startDateString={pendingOrder?.startPaymentDate} />
              )}
            </Suspense>
          </Card>
        </form>
      </FormProvider>
    </CheckoutContext.Provider>
  );
};
