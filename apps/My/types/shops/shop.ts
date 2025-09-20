export interface IShop {
    id:             string;
    name:           string;
    firstname:      null;
    lastname:       null;
    profilePicture: ProfilePicture;
    user:           User;
}

interface ProfilePicture {
    id:  number;
    url: string;
}

interface User {
    id:            string;
    paymentDetail: PaymentDetail;
}

interface PaymentDetail {
    id:         string;
    cardToCard: CardToCard;
    zarinpal:   {
        id: string
    }
}

interface CardToCard {
    id:            string;
    bankName:      string;
    cardNumber:    string;
    iban:          string;
    accountHolder: string;
}
