import { IOrderPaymentVerify } from './orderPaymentVerify';
import { IPaymentMethods } from './paymentMethods';
import { ISubscriptionPaymentVerify } from './subscriptionPaymentVerify';

export namespace PaymentNamespace {
  export namespace GET {
    export type PaymentMethods = IPaymentMethods;
    export type SubscriptionPaymentVerify = ISubscriptionPaymentVerify;
    export type OrderpaymentVerify = IOrderPaymentVerify;
  }
}
