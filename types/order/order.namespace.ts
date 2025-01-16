import { IOrder } from "./order";
import { ICanQuantityUp } from './canQuantityUp';
import { IStartPayment } from "./startPayment";
import { ICreateOrder } from "./createOrder";
import { IPendingOrder } from "./pendingOrder";

export namespace OrderNamespace {
    export namespace GET {
        export type Order = IOrder;
        export type Pending = IPendingOrder
    }

    export namespace POST {
        export type CanQuantityUp = ICanQuantityUp
        export type StartPayment = IStartPayment
        export type CreateOrder = ICreateOrder
    }
}