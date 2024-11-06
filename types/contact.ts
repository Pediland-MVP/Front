export namespace ContactNamespace {
  export interface GET {
    items: ContactItem[];
    meta: Meta;
  }

  export type Contact = Omit<
    ContactItem,
    "messagesCount" | "latestMessageDate"
  >;

  export type Contacts = ContactItem[];
}
interface ContactItem {
  lead: Lead;
  id: string;
  createDate: string;
  updateDate: string;
  firstname: string | null;
  lastname: string | null;
  mobile: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  postalcode: string | null;
  address: string | null;
  gender: "male" | "female" | "other" | null;
  birthDate: string | null;
  messagesCount: string;
  latestMessageDate: string;
  username: string;
}

export interface Lead {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: null;
  profilePic: null | string;
  userId: string;
  instagramId: string;
  leadInstagramId: string;
  contactId: string;
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
