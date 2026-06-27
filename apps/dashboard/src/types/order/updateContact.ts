import { IResponseMessage } from '../responseMessage';

export type UpdateContactResponse = IResponseMessage<{
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: string;
  mobile: string;
  email: null;
  country: null;
  postalcode: string;
  address: string;
  gender: null;
  birthDate: null;
  cityId: number;
  city: City;
}>;

interface City {
  id: number;
  name: string;
  slug: string;
  province?: City;
  tel_prefix?: string;
}
