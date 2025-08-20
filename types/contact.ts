// src/types/contact.ts

import { Paginated } from "./api";

export type ContactsGetResponse = Paginated<ContactWire>;

// ------------- WIRE (raw API) -------------
export type GenderWire = "male" | "female" | "other" | null;
export type ISODateString = string;

export interface LeadWire {
  contactId: string;
  createDate: ISODateString;
  firstname: string;
  id: string;
  instagramId: string;
  lastname: string | null;
  profilePic: string | null;
  updateDate: ISODateString;
  userId: string;
}

export interface ContactWire {
  id: string;
  username: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  postalcode: string | null;
  cityId: string | null;
  country: string | null;
  gender: GenderWire;
  birthDate: ISODateString | null;
  createDate: ISODateString;
  updateDate: ISODateString;
  messagesCount: string; // ⚠️ comes as string from API
  latestMessageDate: ISODateString; // string in wire
  lead: LeadWire;
}

// ------------- DOMAIN (used in UI) -------------
export type Gender = "male" | "female" | "other";

export interface Lead {
  contactId: string;
  createDate: Date;
  firstname: string;
  id: string;
  instagramId: string;
  lastname: string | null;
  profilePic: string | null;
  updateDate: Date;
  userId: string;
}

export interface Contact {
  id: string;
  username: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  postalcode: string | null;
  cityId: string | null;
  country: string | null;
  gender: Gender | null;
  birthDate: Date | null;
  createDate: Date;
  updateDate: Date;
  messagesCount: number; // parsed
  latestMessageDate: Date;
  lead: Lead;
}
