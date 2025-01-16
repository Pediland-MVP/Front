export interface IPendingOrder {
  status: string;
  from: string;
  step: number;
  instagram: Instagram;
  lead: Instagram;
  orderCardToCard: OrderCardToCard;
  startPaymentDate: null;
  paymentMethod: null;
  id: string;
  createDate: Date;
  updateDate: Date;
  orderProducts: IOrderProduct[];
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
}
