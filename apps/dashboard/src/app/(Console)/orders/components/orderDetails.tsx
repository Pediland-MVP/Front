'use client';

import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ImageWithFallback from '@/components/ui/imageWithCallback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import api from '@/hooks/swr/api-client';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import { ORDER_STATUS, type OrderNamespace } from '@/types/order/order.namespace';
import { useGetOrderPrices } from '@/utils/getOrderPrices';
import { zodResolver } from '@hookform/resolvers/zod';
import { PenIcon } from '@phosphor-icons/react/dist/ssr/Pen';
import type { AxiosError } from 'axios';
import { CreditCard, Loader2, MapPin, Package, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type React from 'react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import * as z from 'zod';
import { OrderInstagramProfile } from './orderInstagramProfile';

const statusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUS),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface OrderDetailsProps {
  order: OrderNamespace.GET.OneItemOfOrders;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OrderDetails({ order, setOpen }: OrderDetailsProps) {
  const t = useTranslations('Orders.OrderDetails');
  const t_ec = useTranslations('ERROR_CODES');

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
  });

  const onSubmit = async (data: StatusFormData) => {
    setIsLoading(true);

    await api
      .post(`orders/${order.id}/updateStatus`, {
        ...data,
      })
      .then(async (res) => {
        toast.success(t('statusUpdated'));
        await mutate((key: any) => typeof key === 'string' && key.includes('/orders?page='));
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e.response?.data.code));
      })
      .finally(() => setIsLoading(false));
  };

  if (!order) {
    return <LoaderSpin />;
  }

  const { isDiscount, paidPrice, totalPrice, shippingCost } = useGetOrderPrices(
    order.orderProducts,
  );

  return (
    <div className="h-full max-h-[calc(100vh-10rem)] w-full overflow-y-auto">
      <div className="grid grid-cols-1 gap-6 pb-4 lg:grid-cols-2">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('orderDetails')}</CardTitle>
                <Badge className="px-2 py-1">{t(`orderStatus.${order.status}`)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {/* Product Details Section */}
                <div className="w-full">
                  <h3 className="mb-2 flex items-center text-lg font-semibold">
                    <Package className="mr-2" size={20} />
                    {t('productDetails')}
                  </h3>
                  <div>
                    {order.orderProducts.map((op) => (
                      <div
                        key={op.id}
                        className="hover:bg-accent/10 mb-4 flex items-center gap-x-3 space-x-4 rounded-md p-2 transition-colors duration-200"
                      >
                        <Image
                          src={op.product?.images[0]?.url || '/placeholder.svg'}
                          alt={op.product?.title}
                          width={64}
                          height={64}
                          className="flex-shrink-0 rounded-md shadow-sm"
                        />
                        <div>
                          <h4 className="font-medium">
                            {op.product ? op.product?.title : t('productDeleted')}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {t('quantity')}: {op.quantity} | {t('price')}:{' '}
                            {op.product?.price.toLocaleString()}
                          </p>
                          <div className="mt-1 flex gap-x-1">
                            {op.attributeValues.map((av) => (
                              <Badge variant={'outline'}>{av.value}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div>
                    {t('totalPrice')}: {totalPrice.toLocaleString()}
                  </div>
                  <div>
                    {t('shippingCost')}: {shippingCost?.toLocaleString()}
                  </div>
                  <div className="text-primary font-bold">
                    {t('paidPrice')}: {paidPrice.toLocaleString()}
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="space-y-4">
                  <div className="bg-accent/5 rounded-md p-4">
                    <h3 className="text-primary mb-2 flex items-center text-lg font-semibold">
                      <User className="mr-2" size={20} />
                      {t('customerDetails')}
                    </h3>
                    <p>
                      {order.lead.firstname} {order.lead.lastname}
                    </p>
                    <p>{order.lead.contact.email}</p>
                    <p>{order.lead.contact.mobile}</p>
                  </div>

                  {/* Product Field Values Section */}
                  {(order?.productFieldValues?.length || 0) > 0 && (
                    <div className="bg-accent/5 rounded-md p-4">
                      <h3 className="text-primary mb-2 flex items-center text-lg font-semibold">
                        <PenIcon className="mr-2" size={20} />
                        {t('productFieldValues')}
                      </h3>
                      <div>
                        {order.productFieldValues?.map((pf, index) => (
                          <div key={index} className="mb-4">
                            <p className="font-medium">{pf.field.label}</p>
                            <p className="text-sm break-words whitespace-pre-wrap">{pf.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address Section */}
                  <div className="bg-accent/5 rounded-md p-4">
                    <h3 className="text-primary mb-2 flex items-center text-lg font-semibold">
                      <MapPin className="mr-2" size={20} />
                      {t('shippingAddress')}
                    </h3>
                    <p>
                      {order.orderShipping?.firstname} {order.orderShipping?.lastname}
                    </p>
                    <p>
                      {order.orderShipping?.city?.province?.name}، {order.orderShipping?.city?.name}
                    </p>
                    <p className="break-words">
                      {order.orderShipping?.address}، {t('postalCode')}:{' '}
                      {order.orderShipping?.postalcode}
                    </p>
                  </div>
                </div>

                {/* Instagram Profile Section */}
                <div>
                  <OrderInstagramProfile lead={order.lead} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Card to Card Image and Status Changer */}
        <div className="space-y-6">
          {/* Card to Card Image */}
          <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-1">
                <CreditCard className="mr-2" size={20} />
                {t('cardToCardImage')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-40 w-40 p-0 transition-shadow duration-300 hover:shadow-md"
                  >
                    <Image
                      src={order.orderCardToCard.url ?? '/images/no-image.png'}
                      alt={t('cardToCardImage')}
                      fill
                      className="h-auto w-full rounded-md object-cover"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="h-[90vh] max-h-[90vh] max-w-3xl">
                  <ImageWithFallback
                    src={order.orderCardToCard?.url ?? '/images/no-image.png'}
                    fallbackSrc="/images/no-image.png"
                    alt={t('cardToCardImage')}
                    fill
                    className="h-auto w-full object-contain"
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Order Status Card */}
          <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>{t('orderStatusTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ORDER_STATUS).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`orderStatus.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('updating')}
                    </>
                  ) : (
                    t('updateStatus')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
