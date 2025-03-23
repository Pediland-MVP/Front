import { OrderNamespace } from "@/types/order/order.namespace";
export function getOrderPrices(
  orderProducts: OrderNamespace.GET.Orders["items"][0]["orderProducts"]
) {
  const paidPrice =
    orderProducts[0]?.quantity *
    (typeof orderProducts[0]?.discountPrice === "number"
      ? orderProducts[0]?.discountPrice
      : orderProducts[0]?.price);

  const totalPrice = orderProducts[0]?.quantity * orderProducts[0]?.price;

  const isDiscount = totalPrice > paidPrice;
  const discount = isDiscount ? totalPrice - paidPrice : 0;

  return {
    totalPrice,
    paidPrice,
    discount,
    isDiscount,
  };
}


export const useGetOrderPrices = (orderProducts: OrderNamespace.GET.Orders["items"][0]["orderProducts"]) => {
  return getOrderPrices(orderProducts)
}