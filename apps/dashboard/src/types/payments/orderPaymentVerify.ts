export interface IOrderPaymentVerify {
  message: string;
  data: Data;
}

interface Data {
  ref_id: number;
  orderProcessText: string | null;
}
