import { GENDERS_ENUM } from "@/constants/gender.constant";
import { ProvinceNamespace } from "./province";

export namespace UserNamespace {
  export type user = IUser;
  export namespace GET {
    export type User = IUser;
  }
}
export interface IUser {
  code: string;
  message: string;
  statusCode: number;
  data: {
    birthDate: Date;
    categoryId: string;
    city: City;
    createDate: Date;
    deleteFlagId: string;
    email: string;
    firstname: string;
    gender: GENDERS_ENUM;
    havePassword: boolean;
    id: string;
    instagrams: Instagram[];
    isDeleteFlages: boolean;
    lastname: string;
    mobile?: string;
    paymentDetailId: string;
    referralUserId: string;
    status: string;
    submittedInstagramUsername: string;
    subscriptions: Subscription[];
    updateDate: Date;
    verified: boolean;
    wallet: string;
    walletId: string;
  };
}

export interface City {
  id: number;
  name: string;
  province?: ProvinceNamespace.Province;
  provinceId: number;
  slug: string;
}

export interface Instagram {
  id: string;
  isIgTokenValid: boolean;
  isIgWebhookSubscribed: boolean;
  isPromotion: boolean;
  profilePicture: {
    url?: string;
  } | null;
  username: string;
}

export interface Subscription {
  id: string;
  createDate: Date;
  updateDate: Date;
  expire: string;
  status: string;
  planDurationId: number;
  userId: string;
  planDuration: PlanDuration;
}

export interface PlanDuration {
  id: number;
  createDate: Date;
  updateDate: Date;
  name: string;
  price: number;
  durationDays: number;
  planId: number;
}
