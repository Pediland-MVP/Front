export interface PostCommentReply {
  id: string;
  text: string;
  commentId: string;
  time: string;
  fromAdmin: boolean;
  instagram: Instagram;
}

export interface Instagram {
  id: string;
  firstname?: string;
  username: string;
  profilePicture: ProfilePicture;
}

export interface ProfilePicture {
  url: string;
}
