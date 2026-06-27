import { IResponseMessage } from '../responseMessage';

export type UpdateShippingResponse = IResponseMessage<{
  order: {
    id: string;
    createDate: string;
    updateDate: string;
    startPaymentDate: string | null;
    status: string;
    from: string;
    step: number;
    paymentMethod: string | null;
    orderProducts: {
      id: string;
      createDate: string;
      updateDate: string;
      price: number;
      quantity: number;
      product: {
        id: string;
        createDate: string;
        updateDate: string;
        title: string;
        price: number;
        discountPrice: number | null;
        quantity: number;
        status: boolean;
        isInfinite: boolean;
        description: string;
        images: {
          id: number;
          createDate: string;
          updateDate: string;
          mimeType: string;
          name: string;
          url: string;
          tubmnailUrl: string;
          size: number;
          key: string;
        }[];
      };
    }[];
  };
  step: number;
}>;
