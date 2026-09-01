import { ReferralCodeTypeEnum } from './plans.enum';

export interface IPlansData {
  data: any;
  plans: IPlan[];
  discount: IDiscount;
}

export interface IPlan {
  id: number;
  createDate: Date;
  updateDate: Date;
  isActive: boolean;
  name: string;
  description: string;
  minFollowers: number;
  maxFollowers: number;
  durations: IDuration[];
  features: string[];
}

export interface IDuration {
  createDate: Date;
  discountPrice?: number;
  durationDays: number;
  id: number;
  monthlyDiscount?: number | null;
  name: string;
  planId: number;
  price: number;
  updateDate: Date;
}

interface IDiscount {
  haveDiscount: boolean;
  from?: {
    firstname: string;
    lastname: string;
  };
  discount?: number;
  type?: ReferralCodeTypeEnum;
}
