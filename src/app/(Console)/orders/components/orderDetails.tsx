"use client";

import type React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import type { ExceptionMessage } from "@/types/exceptionMessage";
import { Loader2, Package, User, MapPin, CreditCard } from "lucide-react";
import { mutate } from "swr";
import {
  ORDER_STATUS,
  type OrderNamespace,
} from "@/types/order/order.namespace";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderInstagramProfile } from "./orderInstagramProfile";
import ImageWithFallback from "@/components/ui/imageWithCallback";
import api from "@/hooks/swr/api-client";
import type { AxiosError } from "axios";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Pen } from "@phosphor-icons/react/dist/ssr";
import { getOrderPrices, useGetOrderPrices } from "@/utils/getOrderPrices";

const statusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUS),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface OrderDetailsProps {
  order: OrderNamespace.GET.OneItemOfOrders;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function OrderDetails({ order, setOpen }: OrderDetailsProps) {
  const t = useTranslations("Orders.OrderDetails");
  const t_ec = useTranslations("ERROR_CODES");

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
        toast({
          title: t("statusUpdated"),
        });
        await mutate(
          (key: any) => typeof key === "string" && key.includes("/orders?page=")
        );
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast({
          title: t_ec(e.response?.data.code),
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  if (!order) {
    return <LoadingSpinner />;
  }

  const { isDiscount, paidPrice, totalPrice, shippingCost } = useGetOrderPrices(order.orderProducts);

  return (
    <div className="w-full h-full overflow-y-auto max-h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("orderDetails")}</CardTitle>
                <Badge className="px-2 py-1">
                  {t(`orderStatus.${order.status}`)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {/* Product Details Section */}
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Package className="mr-2" size={20} />
                    {t("productDetails")}
                  </h3>
                  <div>
                    {order.orderProducts.map((op) => (
                      <div
                        key={op.id}
                        className="flex gap-x-3 items-center space-x-4 mb-4 p-2 rounded-md hover:bg-accent/10 transition-colors duration-200"
                      >
                        <Image
                          src={op.product?.images[0]?.url || "/placeholder.svg"}
                          alt={op.product?.title}
                          width={64}
                          height={64}
                          className="rounded-md shadow-sm flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-medium">{op.product ? op.product?.title : t('productDeleted')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t("quantity")}: {op.quantity} | {t("price")}:{" "}
                            {op.product?.price.toLocaleString()}
                          </p>
                          <div className="flex gap-x-1 mt-1">
                            {op.attributeValues.map((av) => (
                              <Badge variant={"outline"}>{av.value}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div>
                    {t("totalPrice")}: {totalPrice.toLocaleString()}
                  </div>
                  <div>
                    {t("shippingCost")}: {shippingCost?.toLocaleString()}
                  </div>
                  <div className="font-bold text-primary">
                    {t("paidPrice")}: {paidPrice.toLocaleString()}
                  </div>
                </div>

                {/* Customer Details Section */}
                <div className="space-y-4">
                  <div className="bg-accent/5 p-4 rounded-md">
                    <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                      <User className="mr-2" size={20} />
                      {t("customerDetails")}
                    </h3>
                    <p>
                      {order.lead.firstname} {order.lead.lastname}
                    </p>
                    <p>{order.lead.contact.email}</p>
                    <p>{order.lead.contact.mobile}</p>
                  </div>

                  {/* Product Field Values Section */}
                  {(order?.productFieldValues?.length || 0) > 0 && (
                    <div className="bg-accent/5 p-4 rounded-md">
                      <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                        <Pen className="mr-2" size={20} />
                        {t("productFieldValues")}
                      </h3>
                      <div>
                        {order.productFieldValues?.map((pf, index) => (
                          <div key={index} className="mb-4">
                            <p className="font-medium">{pf.field.label}</p>
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {pf.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address Section */}
                  <div className="bg-accent/5 p-4 rounded-md">
                    <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                      <MapPin className="mr-2" size={20} />
                      {t("shippingAddress")}
                    </h3>
                    <p>
                      {order.orderShipping?.firstname}{" "}
                      {order.orderShipping?.lastname}
                    </p>
                    <p>
                      {order.orderShipping?.city?.province?.name}،{" "}
                      {order.orderShipping?.city?.name}
                    </p>
                    <p className="break-words">
                      {order.orderShipping?.address}، {t("postalCode")}:{" "}
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
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-1">
                <CreditCard className="mr-2" size={20} />
                {t("cardToCardImage")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              <Dialog
                open={isImageModalOpen}
                onOpenChange={setIsImageModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-40 w-40 p-0 hover:shadow-md transition-shadow duration-300"
                  >
                    <Image
                      src={order.orderCardToCard.url ?? "/images/no-image.png"}
                      alt={t("cardToCardImage")}
                      fill
                      className="w-full h-auto object-cover rounded-md"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl h-[90vh] max-h-[90vh]">
                  <ImageWithFallback
                    src={order.orderCardToCard?.url ?? "/images/no-image.png"}
                    fallbackSrc="/images/no-image.png"
                    alt={t("cardToCardImage")}
                    fill
                    className="w-full h-auto object-contain"
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Order Status Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>{t("orderStatusTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectStatus")} />
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("updating")}
                    </>
                  ) : (
                    t("updateStatus")
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
