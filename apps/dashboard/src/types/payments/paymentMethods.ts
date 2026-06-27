export interface IPaymentMethods {
  id: string;
  createDate: Date;
  updateDate: Date;
  zarinpal?: CardToCard | null;
  cardToCard?: CardToCard | null;
}

export interface CardToCard {
  id: string;
  createDate: Date;
  updateDate: Date;
}
