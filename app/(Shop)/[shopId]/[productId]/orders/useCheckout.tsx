import { OrderNamespace } from "@/types/order";
import { createContext, useContext } from "react";

export type CheckoutContextType = {
    shopId: string
    productId: string
    token?: string
    product: OrderNamespace.Order['orderProducts'][0]['product'] | undefined,
    orderQuantity: number | undefined
}

export const CheckoutContext = createContext<CheckoutContextType | null>(null)

export function useCheckout() {
    const context = useContext(CheckoutContext)
    if (context === null) {
        throw new Error("useCheckout must be used within a CheckoutProvider")
    }
    return context
}