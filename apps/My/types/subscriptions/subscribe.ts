import { IResponseMessage } from "../responseMessage";

export interface ISubscribe extends IResponseMessage<Data> {}
interface Data {
    paymentMethod: string;
    link:          string;
}
