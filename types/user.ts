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
}

export interface City {
    id:          number;
    name:        string;
    slug:        string;
    province?:   City;
    tel_prefix?: string;
}
