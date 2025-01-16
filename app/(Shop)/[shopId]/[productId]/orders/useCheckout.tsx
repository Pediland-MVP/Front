import { ProductNamespace } from "@/types/product";
import { ShopNamespace } from "@/types/shops/shop.namespace";
import { createContext, Dispatch, useContext } from "react";

export type CheckoutContextType = {
    shopId: string
    productId: string
    product: ProductNamespace.PublicProduct | undefined
    token: string | undefined
    orderQuantity: number
    setOrderQuantity: Dispatch<React.SetStateAction<number>>;
    step: number,
    setStep: Dispatch<React.SetStateAction<number>>,
    orderId: string | undefined;
    setOrderId: Dispatch<React.SetStateAction<string | undefined>>;
    outOfStock: boolean;
    setOutOfStock: Dispatch<React.SetStateAction<boolean>>;
    shop: ShopNamespace.GET.Shop | undefined
}

export const CheckoutContext = createContext<CheckoutContextType | null>(null)

export function useCheckout() {
    const context = useContext(CheckoutContext)
    if (context === null) {
        throw new Error("useCheckout must be used within a CheckoutProvider")
    }
    return context
}