export interface WsNewComment {
  id: string;
  createDate: Date;
  updateDate: Date;
  text: string;
  mediaId: string;
  commentId: string;
  time: Date;
  fromAdmin: boolean;
  leadInstagram: LeadInstagram;
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
  url: string;
}
