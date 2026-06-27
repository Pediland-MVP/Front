import { From, MemeType, MessageType } from './conversation.namespace';

export interface Message {
  messageId: string;
  sendDate: string;
  from: From;
  text: string;
  messageType: MessageType;
  instagram: MessageInstagram;
  lead: WsNewConversation;
  attachment: null;
  postId: null;
  id: string;
  createDate: Date;
  updateDate: Date;
}

export interface WsNewConversation {
  firstname: string;
  profilePic: string;
  user: UserClass;
  instagram: UserClass;
  leadInstagram: LeadInstagram;
  contact: Contact;
  lastname: null;
  id: string;
  createDate: Date;
  updateDate: Date;
  messages: Message[];
}

export interface MessageInstagram {
  id: string;
  createDate: Date;
  updateDate: Date;
  igToken: string;
  igTokenExpireDate: Date;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  igId: string;
  instagramId: string;
  facebookAccountId: null;
  facebookPageId: null;
  name: string;
  firstname: null;
  lastname: null;
  email: null;
  username: string;
  profileUrl: null;
  profilePictureUrl: string;
  allowFirstLeads: boolean;
  user: User;
  leads: any[];
}

export interface User {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: string;
  lastname: string;
  gender: string;
  birthDate: Date;
  verified: boolean;
  email: null;
  mobile: string;
}

export interface Contact {
  id: string;
  createDate: Date;
  updateDate: Date;
  firstname: null;
  lastname: null;
  mobile: null;
  email: null;
  country: null;
  state: null;
  postalcode: null;
  address: null;
  city: null;
  gender: null;
  birthDate: null;
}

export interface UserClass {
  id: string;
}

export interface LeadInstagram {
  id: string;
  createDate: Date;
  updateDate: Date;
  ASID: string;
  isAdmin: boolean;
  lastUpdate: Date;
  name: string;
  username: string;
  isVerifiedUser: boolean;
  followerCount: number;
  isUserFollowBusiness: boolean;
  isBusinessFollowUser: boolean;
  PSID: null;
  profilePicture: ProfilePicture;
}

export interface ProfilePicture {
  id: number;
  createDate: Date;
  updateDate: Date;
  memeType: MemeType;
  name: string;
  url: string;
  tubmnailUrl: string;
  size: number;
  key: string;
}
