// src/schemas/contact.ts
import { z } from "zod";

export const ISODateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid ISO date");

export const LeadWireSchema = z.object({
  contactId: z.string(),
  createDate: ISODateString,
  firstname: z.string(),
  id: z.string(),
  instagramId: z.string(),
  lastname: z.string().nullable(),
  profilePic: z.string().nullable(),
  updateDate: ISODateString,
  userId: z.string(),
});

export const ContactWireSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
  email: z.string().email().nullable(),
  mobile: z.string().nullable(),
  address: z.string().nullable(),
  postalcode: z.string().nullable(),
  cityId: z.string().nullable(),
  country: z.string().nullable(),
  gender: z.enum(["male", "female", "other"]).nullable(),
  birthDate: ISODateString.nullable(),
  createDate: ISODateString,
  updateDate: ISODateString,
  messagesCount: z.string(),
  latestMessageDate: ISODateString,
  lead: LeadWireSchema,
});

export const PageMetaSchema = z.object({
  currentPage: z.number().int().positive(),
  itemsPerPage: z.number().int().positive(),
  itemCount: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const ContactsGetResponseSchema = z.object({
  items: z.array(ContactWireSchema),
  meta: PageMetaSchema,
});
