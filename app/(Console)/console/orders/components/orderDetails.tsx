"use client";

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
import { Item, ORDER_STATUS } from "@/types/order";
import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import LoadingButton from '@/components/ui/button-loading';
import { mutate } from "swr";

const statusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUS),
});

type StatusFormData = z.infer<typeof statusSchema>;

interface OrderDetailsProps {
  order: Item;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const t = useTranslations("Orders.OrderDetails");
  const Errors = useTranslations("ERRORS")
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: order.status,
    },
  });

  const onSubmit = async (data: StatusFormData) => {
    setIsLoading(true)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${order.id}/updateStatus`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    )
    .then(async res => {
        toast({
            title: t("statusUpdated"),
        })
        await mutate((key: any) => typeof key === 'string' && key.includes("/orders?page="))
    })
    .catch(err => {
        switch((err as ExceptionMessage).code) {
            case "ORDER_NOT_FOUND":
                toast({
                    title: Errors("ORDER_NOT_FOUND"),
                    variant: "destructive",
                })
                break
            case "NO_INSTAGRAM":
                toast({
                    title: Errors("NO_INSTAGRAM"),
                    variant: "destructive",
                })
                break
        }
    })
    .finally(() => {
        setIsLoading(false)
    })
  };

  const totalPrice = order.orderProducts.reduce(
    (sum, op) => sum + op.product.price * op.quantity,
    0
  );

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("productDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            {order.orderProducts.map((op) => (
              <div key={op.id} className="flex items-center space-x-4 mb-4">
                <Image
                  src={op.product.images[0]?.url || "/placeholder.svg"}
                  alt={op.product.title}
                  width={64}
                  height={64}
                  className="rounded-md"
                />
                <div>
                  <h3 className="font-semibold">{op.product.title}</h3>
                  <p>
                    {t("quantity")}: {op.quantity}
                  </p>
                  <p>
                    {t("price")}: {op.product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-4 font-bold">
              {t("totalPrice")}: {totalPrice.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("cardToCardImage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full p-0 h-auto">
                  <Image
                    src={order.orderCardToCard.url}
                    alt={t("cardToCardImage")}
                    width={300}
                    height={200}
                    className="w-full h-auto object-cover rounded-md"
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <Image
                  src={order.orderCardToCard.url}
                  alt={t("cardToCardImage")}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("customerDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {t("name")}: {order.lead.firstname} {order.lead.lastname}
            </p>
            <p>
              {t("email")}: {order.lead.contact.email}
            </p>
            <p>
              {t("phone")}: {order.lead.contact.mobile}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("shippingAddress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              {t("address")}: {order.lead.contact.address}
            </p>
            <p>
              {t("city")}: {order.lead.contact.city}
            </p>
            <p>
              {t("state")}: {order.lead.contact.state}
            </p>
            <p>
              {t("postalCode")}: {order.lead.contact.postalcode}
            </p>
          </CardContent>
        </Card>

        <Card>
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
              <LoadingButton isLoading={isLoading} type="submit">{t("updateStatus")}</LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
