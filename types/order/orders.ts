import { ORDER_STATUS } from "./order.namespace";

export interface IOrders {
    items: Item[];
    meta:  Meta;
}

interface Item {
    id:               string;
    createDate:       Date;
    updateDate:       Date;
    startPaymentDate: Date | null;
    status:           ORDER_STATUS;
    from:             From;
    step:             number;
    paymentMethod:    null | string;
    orderCardToCard:  OrderCardToCard;
    orderProducts:    OrderProduct[];
    lead:             Lead;
    instagram:        Instagram;
    shipping:         Shipping
}

export interface Shipping {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   string;
    mobile:     string;
    email:      string;
    country:    string;
    postalcode: string;
    address:    string;
    city: {
        id: number,
        name: string,
        province: {
            id: number,
            name: string
        }
    }
    cityId:     string;
    orderId:    string;
}


enum From {
    Instagram = "instagram",
}

interface Instagram {
    id: string;
}

interface Lead {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  LeadFirstname;
    lastname:   null;
    profilePic: string;
    contact:    Contact;
}

interface Contact {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  ContactFirstname;
    lastname:   Lastname;
    mobile:     string;
    email:      null | string;
    country:    null;
    postalcode: string;
    address:    Address;
    gender:     null | string;
    birthDate:  Date | null;
    cityId:     number;
}

enum Address {
    Ffsdfsdfsdfgsdgdfg = "ffsdfsdfsdfgsdgdfg",
    Sdfsdfsdffsdf = "sdfsdfsdffsdf",
}

enum ContactFirstname {
    سینا = "سینا",
    علیAsdfas = "علیasdfas",
}

enum Lastname {
    سریزدی = "سریزدی",
    پیرانیErsdfsdf = "پیرانیersdfsdf",
}

enum LeadFirstname {
    Mahnaz = "Mahnaz",
    SinaPirani = "Sina Pirani",
}

interface OrderCardToCard {
    id:         string;
    createDate: Date;
    updateDate: Date;
    url:        null;
    key:        null;
}

interface OrderProduct {
    id:         string;
    createDate: Date;
    updateDate: Date;
    price:      number;
    quantity:   number;
    product:    Product;
}

interface Product {
    id:            string;
    createDate:    Date;
    updateDate:    Date;
    title:         string;
    price:         number;
    discountPrice: null;
    quantity:      number;
    status:        boolean;
    isInfinite:    boolean;
    description:   string;
    isDigital:     boolean;
    images:        Image[];
}

export interface Image {
    id:          number;
    createDate:  Date;
    updateDate:  Date;
    mimeType:    string;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
}

export enum Status {
    Cancelled = "cancelled",
    Processing = "processing",
}

export interface Meta {
    currentPage:  number;
    itemCount:    number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
