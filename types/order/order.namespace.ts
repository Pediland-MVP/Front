import { IOrder } from "./order";
import { ICanQuantityUpResponse } from './canQuantityUp';
import { IStartPayment } from "./startPayment";
import { OrderTypestrategyExportType } from "./createOrder";
import { IPendingOrder } from "./pendingOrder";
import { IOrders } from "./orders";
import { UpdateShippingResponse } from "./updateShipping";
import { UpdateContactResponse } from "./updateContact";

export namespace OrderNamespace {
    export namespace GET {
        export type Order = IOrder;
        export type Orders = IOrders
        export type Pending = IPendingOrder
    }

    export namespace POST {
        export type CanQuantityUp = ICanQuantityUpResponse
        export type StartPayment = IStartPayment
        export type CreateOrder = OrderTypestrategyExportType
        export type UpdateShipping = UpdateShippingResponse
        export type UpdateContact = UpdateContactResponse
    }
}

export enum ORDER_STATUS {
    PENDING = 'pending',
    PAYMENT = 'payment',
    PROCESSING = 'processing',
    SENDING = 'sending',
    COMPLETED = 'completed',
    INVALID_DATA = 'invalid_data',
    CANCELLED = 'cancelled',
}