import { Meta } from './meta';
import { IResponseMessage } from './responseMessage';

export namespace InstagramNamespace {
  export namespace GET {
    export type RedirectLink = IResponseMessage<{ link: string }>;
    export type FollowersLookup = IResponseMessage<{ username: string; followersCount: number }>;
  }
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
    isIgTokenValid: boolean;
    isPromotion: boolean;
    followersCount?: number;
    /** Live count of automations currently linked to this page (not the internal
     * never-decreasing counter — this goes back down if an automation is deleted). */
    automationCount: number;
    /** Configured free-automation limit (admin-settable, default 2) — same for every account. */
    freeAutomationLimit: number;
    /** One-way sticky flag: whether this page has ever crossed its free automation quota.
     * NOT the same as `isPromotion` — a page can be over quota but still not promoted if
     * it has active subscription coverage. Use this (not `isPromotion`) to decide whether
     * to show the free-quota warning dialog. */
    freeAutomationQuotaExceeded: boolean;
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
    Accounts: IResponseMessage<Account[]>;
    Pages: Page[];
    Conversations: Conversations;
    Conversation: IOneConversation;
  }
}

export interface IOneConversation {
  items: Messages[];
  meta: Meta;
}

export interface Conversations {
  items: IConversation[];
  meta: Meta;
}
export interface IConversation {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: null;
  profilePic: string;
  leadInstagram: LeadInstagram;
  messages: Messages[];
}

export interface LeadInstagram {
  id: string;
  profilePicture: ProfilePicture;
}

export interface ProfilePicture {
  id: number;
  url: string;
}

export interface Messages {
  id: string;
  createDate: Date;
  updateDate: Date;
  messageId: string;
  attachment: null;
  sendDate: Date;
  from: 'instagram' | 'lead';

  postId: null;
  text: string;
  messageType: string;
}
