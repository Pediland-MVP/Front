interface OrderProduct {
    quantity:   number;
    order:      IStartPayment;
    product:    Product;
    id:         string;
    createDate: Date;
    updateDate: Date;
}

export interface IStartPayment {
    id:               string;
    createDate:       Date;
    updateDate:       Date;
    startPaymentDate: null;
    status:           string;
    from:             string;
    step:             number;
    paymentMethod:    null;
    orderProducts?:   OrderProduct[];
}

interface Product {
    id:            string;
    createDate:    Date;
    updateDate:    Date;
    title:         string;
    price:         number;
    discountPrice: number;
    quantity:      number;
    status:        boolean;
    isInfinite:    boolean;
    description:   string;
    isDigital:     boolean;
    orderProducts: any[];
}
