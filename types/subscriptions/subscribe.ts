export interface ISubscribe {
    message: string;
    data:    Data;
}
interface Data {
    paymentMethod: string;
    link:          string;
}
