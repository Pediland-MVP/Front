
export interface GetComments {
  items: CommentItem[];
  meta: Meta;
}

export interface CommentItem {
  id: string;
  createDate: Date;
  updateDate: Date;
  text: string;
  mediaId: string;
  commentId: string;
  time: Date;
  leadInstagram: LeadInstagram;
}

export interface LeadInstagram {
  id: string;
  createDate: Date;
  updateDate: Date;
  ASID: string;
  lastUpdate: Date;
  name: string;
  username: string;
  isVerifiedUser: boolean;
  followerCount: number;
  isUserFollowBusiness: boolean;
  isBusinessFollowUser: boolean;
  PSID: null;
  profilePicture: {
    url?: string;
  };
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
