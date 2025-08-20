import { ORDER_PAYMENT_METHODS } from "./order.enum";

export interface IStartPayment {
    message: string;
    data:    Data;
}
 interface Data {
    paymentMethod: ORDER_PAYMENT_METHODS;
    link?:          string;
}
