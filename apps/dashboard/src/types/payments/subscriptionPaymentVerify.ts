export interface ISubscriptionPaymentVerify {
  message: string;
  data: Data;
}

interface Data {
  ref_id: number;
  pooled: boolean;
}
