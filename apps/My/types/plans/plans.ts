import { ReferralCodeTypeEnum } from "./plans.enum";

export interface IPlansData {
    plans:        IPlan[];
    discount: IDiscount;
}

export interface IPlan {
    id:           number;
    createDate:   Date;
    updateDate:   Date;
    isActive:     boolean;
    name:         string;
    description:  string;
    minFollowers: number;
    maxFollowers: number;
    durations:    IDuration[];
    features:     string[]
}

export interface IDuration {
    id:           number;
    createDate:   Date;
    updateDate:   Date;
    name:         string;
    price:        number;
    monthlyDiscount?: number | null;
    discountPrice?: number;
    durationDays: number;
    planId:       number;
}

interface IDiscount {
    haveDiscount: boolean;
    from?: {
        firstname: string,
        lastname: string
    },
    discount?: number,
    type?: ReferralCodeTypeEnum
}