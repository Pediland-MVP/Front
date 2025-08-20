import { ISubscribe } from "./subscribe";
import { ISubscriptions } from "./subscriptions";

export namespace SubscriptionNamespace {
    export namespace POST {
        export type Subscribe = ISubscribe
    }
    export namespace GET {
        export type Subscriptions = ISubscriptions
    }
}