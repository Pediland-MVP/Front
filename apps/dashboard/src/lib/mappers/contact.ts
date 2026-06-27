// src/lib/mappers/contact.ts
import { Contact, ContactWire, Lead, LeadWire } from '@/types/contact';

const toDate = (s: string | null | undefined): Date | null => (s ? new Date(s) : null);

const toLead = (wire: LeadWire): Lead => ({
  ...wire,
  createDate: new Date(wire.createDate),
  updateDate: new Date(wire.updateDate),
});

export const toContact = (wire: ContactWire): Contact => ({
  id: wire.id,
  username: wire.username,
  firstname: wire.firstname,
  lastname: wire.lastname,
  email: wire.email,
  mobile: wire.mobile,
  address: wire.address,
  postalcode: wire.postalcode,
  cityId: wire.cityId,
  country: wire.country,
  gender: wire.gender, // already union | null
  birthDate: toDate(wire.birthDate),
  createDate: new Date(wire.createDate),
  updateDate: new Date(wire.updateDate),
  messagesCount: Number(wire.messagesCount ?? 0),
  latestMessageDate: new Date(wire.latestMessageDate),
  lead: toLead(wire.lead),
});
