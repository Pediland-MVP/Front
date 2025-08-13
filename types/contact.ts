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
  address: string | null;
  birthDate: string | null;
  cityId: string | null;
  country: string | null;
  createDate: string;
  email: string | null;
  firstname: string | null;
  gender: "male" | "female" | "other" | null;
  id: string;
  lastname: string | null;
  latestMessageDate: string;
  lead: Lead;
  messagesCount: string;
  mobile: string | null;
  postalcode: string | null;
  updateDate: string;
  username: string;
}

export interface Lead {
  contactId: string;
  createDate: Date;
  firstname: string;
  id: string;
  instagramId: string;
  lastname: null;
  profilePic: null | string;
  updateDate: Date;
  userId: string;
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
