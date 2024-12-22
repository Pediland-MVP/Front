import { GENDERS_ENUM } from "@/app/constants/gender.constant";

export namespace OrderNamespace {
    export type Order = IOrder
    export type GET = IOrderGet
}


export interface IOrder {
    id:              string;
    secret:          string;
    createDate:      string;
    updateDate:      string;
    status:          string;
    from:            string;
    paymentMethod:   string;
    instagram:       Instagram;
    orderCardToCard: OrderCardToCard;
    orderProducts:   OrderProduct[];
    lead:            Lead;
}

export interface Instagram {
    id:                string;
    createDate:        Date;
    updateDate:        Date;
    igTokenExpireDate: Date;
    followersCount:    number;
    followsCount:      number;
    mediaCount:        number;
    igId:              string;
    instagramId:       string;
    facebookAccountId: null;
    facebookPageId:    null;
    name:              string;
    firstname:         string;
    lastname:          string | null;
    email:             string | null;
    username:          string;
    profileUrl:        string | null;
    profilePictureUrl: string;
    allowFirstLeads:   boolean;
}

export interface Lead {
    id:      string;
    contact: Contact;
}

export interface Contact {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname?:  string;
    lastname?:   string;
    mobile?:     string;
    email?:      string;
    country?:    string;
    postalcode?: string;
    address?:    string;
    city?:       string;
    gender?:     GENDERS_ENUM;
    birthDate?:  string;
    state?:      string
}

export interface OrderCardToCard {
    id:         string;
    createDate: Date;
    updateDate: Date;
    url:        string;
    key:        string;
}

export interface OrderProduct {
    id:      string;
    product: Product;
    quantity: number
}

export interface Product {
    id:          string;
    createDate:  Date;
    updateDate:  Date;
    title:       string;
    price:       number;
    quantity:    number;
    status:      boolean;
    isInfinite:  boolean;
    description: string;
    isDigital:   boolean;
    images:      Image[];
}

export interface Image {
    id:          number;
    createDate:  Date;
    updateDate:  Date;
    memeType:    string;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
}


export enum ORDER_STATUS {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SENDING = 'sending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum ORDER_FROM {
    INSTAGRAM = 'instagram',
}

export enum ORDER_PAYMENT_METHODS {
    CARD_TO_CARD = 'card_to_card',
    ZARINPAL = 'zarinpal',
}










export interface IOrderGet {
    items: Item[];
    meta:  GetMeta;
}

export interface Item {
    id:              string;
    secret:          string;
    createDate:      Date;
    updateDate:      Date;
    status:          ORDER_STATUS;
    from:            ORDER_FROM;
    paymentMethod:   ORDER_PAYMENT_METHODS;
    orderCardToCard: GetOrderCardToCard;
    orderProducts:   GetOrderProduct[];
    lead:            GetLead;
}

export interface GetLead {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   null;
    profilePic: string;
    contact:    GetContact;
}

export interface GetContact {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   string;
    mobile:     string;
    email:      string;
    country:    string;
    state:      string;
    postalcode: string;
    address:    string;
    city:       string;
    gender:     string;
    birthDate:  Date;
}

export interface GetOrderCardToCard {
    id:         string;
    createDate: Date;
    updateDate: Date;
    url:        string;
    key:        string;
}

export interface GetOrderProduct {
    id:         string;
    createDate: Date;
    updateDate: Date;
    quantity:   number;
    product:    GetProduct;
}

export interface GetProduct {
    id:          string;
    createDate:  Date;
    updateDate:  Date;
    title:       string;
    price:       number;
    quantity:    number;
    status:      boolean;
    isInfinite:  boolean;
    description: string;
    isDigital:   boolean;
    images:      GetProductImage[]
}


export interface GetProductImage {
    id:          number;
    createDate:  Date;
    updateDate:  Date;
    memeType:    string;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
}

export interface GetMeta {
    currentPage:  number;
    itemCount:    number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
