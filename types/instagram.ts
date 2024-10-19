import { Meta } from "./meta";

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
    Conversations: Conversations;
    Conversation: Conversation;
  }
}

export interface Conversation {
  items: Messages[];
  meta: Meta;
}

export interface Conversations {
  items: Item[];
  meta: Meta;
}
export interface Item {
  id:            string;
  createDate:    Date;
  updateDate:    Date;
  firstname:     string;
  lastname:      null;
  profilePic:    string;
  leadInstagram: LeadInstagram;
  messages:      Messages;
}

export interface LeadInstagram {
  id:             string;
  profilePicture: ProfilePicture;
}

export interface ProfilePicture {
  id:  number;
  url: string;
}

export interface Messages {
  id:          string;
  createDate:  Date;
  updateDate:  Date;
  messageId:   string;
  attachment:  null;
  sendDate:    Date;
  from: "instagram" | "lead";

  postId:      null;
  text:        string;
  messageType: string;
  
}


