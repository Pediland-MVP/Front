export namespace InstagramNamespace {
  export interface Account {
    id: string;
    createDate: string;
    updateDate: string;
    instagramId: string | null;
    facebookAccountId: string;
    facebookPageId: string | null;
    name: string;
    firstname: string;
    lastname: string;
    email: string | null;
    username: string | null;
    profileUrl: string;
    profilePictureUrl: string | null;
  }

  export interface Page {
    name: string;
    username: string;
    followers_count: number;
    follows_count: number;
    profile_picture_url?: string;
    biography: string;
    id: string;
  }

  export interface GET {
    Accounts: Account[];
    Pages: Page[];
    AllMessages: AllMessages;
  }
}

export interface AllMessages {
  items: Item[];
  meta: Meta;
}
export interface Item {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: null;
  profilePic: string;
  messages: Messages;
}

export interface Messages {
  id: string;
  createDate: Date;
  updateDate: Date;
  messageId: string;
  text: string;
  attachment: null;
  sendDate: Date;
  from: string;
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
