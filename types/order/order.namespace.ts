import { IOrder } from "./order";
import { ICanQuantityUp } from './canQuantityUp';

export namespace OrderNamespace {
    export namespace GET {
        export type Order = IOrder;
    }

    export namespace POST {
        export type CanQuantityUp = ICanQuantityUp       
    }
}