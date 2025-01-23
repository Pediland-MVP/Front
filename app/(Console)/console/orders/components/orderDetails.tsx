"use client"

import type React from "react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { ExceptionMessage } from "@/types/exceptionMessage"
import { Loader2, Package, User, MapPin, CreditCard } from "lucide-react"
import { mutate } from "swr"
import { ORDER_STATUS, type OrderNamespace } from "@/types/order/order.namespace"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const statusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUS),
})

type StatusFormData = z.infer<typeof statusSchema>

interface OrderDetailsProps {
  order: OrderNamespace.GET.Orders["items"][0]
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function OrderDetails({ order, setOpen }: OrderDetailsProps) {
  const t = useTranslations("Orders.OrderDetails")
  const Errors = useTranslations("ERRORS")
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit } = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: order!.status,
    },
  })

  const onSubmit = async (data: StatusFormData) => {
    setIsLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${order.id}/updateStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (data.status === ORDER_STATUS.PENDING) {
        setOpen(false)
      }
      toast({
        title: t("statusUpdated"),
      })
      await mutate((key: any) => typeof key === "string" && key.includes("/orders?page="))
    } catch (err) {
      switch ((err as ExceptionMessage).code) {
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
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = order.orderProducts.reduce((sum, op) => sum + op.product.price * op.quantity, 0)
  const paidPrice = order.orderProducts.reduce((sum, op) => sum + op.price * op.quantity, 0)

  return (
    <div className="space-y-10 p-6 bg-background w-full">
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
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Package className="mr-2" size={20} />
                {t("productDetails")}
              </h3>
              {order.orderProducts.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center space-x-4 mb-4 p-2 rounded-md hover:bg-accent/10 transition-colors duration-200"
                >
                  <Image
                    src={op.product.images[0]?.url || "/placeholder.svg"}
                    alt={op.product.title}
                    width={64}
                    height={64}
                    className="rounded-md shadow-sm"
                  />
                  <div>
                    <h4 className="font-medium">{op.product.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("quantity")}: {op.quantity} | {t("price")}: {op.product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="font-bold text-primary">
                {t("totalPrice")}: {totalPrice.toLocaleString()}
              </div>
              <div className="font-bold text-primary">
                {t("paidPrice")}: {paidPrice.toLocaleString()}
              </div>
            </div>
            <div>
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
              <div className="bg-accent/5 p-4 rounded-md mt-4">
                <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                  <MapPin className="mr-2" size={20} />
                  {t("shippingAddress")}
                </h3>
                <p>{order.lead.contact.address}</p>
                <p>{order.lead.contact.postalcode}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2" size={20} />
              {t("cardToCardImage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full p-0 h-auto hover:shadow-md transition-shadow duration-300">
                  <Image
                    src={order.orderCardToCard.url ?? "/images/no-image.png"}
                    alt={t("cardToCardImage")}
                    width={300}
                    height={200}
                    className="w-full h-auto object-cover rounded-md"
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <Image
                  src={order.orderCardToCard?.url ?? "/images/no-image.png"}
                  alt={t("cardToCardImage")}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
  )
}

