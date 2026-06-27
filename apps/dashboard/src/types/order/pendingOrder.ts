import { ORDER_PAYMENT_METHODS } from './order.enum';

export interface IPendingOrder {
  status: string;
  from: string;
  step: number;
  instagram: Instagram;
  lead: Instagram;
  orderCardToCard: OrderCardToCard;
  startPaymentDate: string | null;
  paymentMethod: ORDER_PAYMENT_METHODS;
  id: string;
  createDate: string;
  updateDate: string;
  orderProducts: IOrderProduct[];
  productFieldValues: IProductFieldValues[];
}

interface Instagram {
  id: string;
}

interface OrderCardToCard {
  url: null;
  key: null;
  id: string;
  createDate: Date;
  updateDate: Date;
}

interface IOrderProduct {
  id: string;
  createDate: Date;
  updateDate: Date;
  quantity: number;
  price: number;
  shippingCost: number | null;
  discountPrice: number | null;
  product: {
    id: string;
    title: string;
  };
}

interface IProductFieldValues {
  id: string;
  value: string;
  fieldId: string;
}
