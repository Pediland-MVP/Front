import { Dispatch } from "react";
import { useCheckout } from "../useCheckout";


export default function useQuantityUpDown() {

    const { orderId, shopId } = useCheckout()
    async function quantityUp(adjustment: 'increment' | 'decrement', setLoading: Dispatch<React.SetStateAction<boolean>>) {
        await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/orders/${shopId}/${orderId}/${adjustment === 'decrement' ? 'quantityDown' : 'quantityUp'}`, {
            
        })
    }

}