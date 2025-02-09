import { GENDERS_ENUM } from "@/app/constants/gender.constant";

export namespace UserNamespace {
    export type user = IUser
    export type GET = IUser
}
export interface IUser {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   string;
    gender:     GENDERS_ENUM;
    birthDate:  Date;
    verified:   boolean;
    email:      string;
    mobile:     string;
    city:       City;
    subscriptions: Subscription[]
}

export interface City {
    id:          number;
    name:        string;
    slug:        string;
    province?:   City;
    tel_prefix?: string;
}


export interface Subscription {
    id:             string;
    createDate:     Date;
    updateDate:     Date;
    expire:         Date | null;
    status:         string;
    planDurationId: number;
    userId:         string;
    planDuration:   PlanDuration;
}

export interface PlanDuration {
    id:           number;
    createDate:   Date;
    updateDate:   Date;
    name:         string;
    price:        number;
    durationDays: number;
    planId:       number;
}
