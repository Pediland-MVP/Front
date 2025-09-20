export interface GetComment {
    id:             string;
    createDate:     string;
    updateDate:     string;
    text:           string;
    mediaId:        string;
    commentId:      string;
    time:           string;
    fromAdmin:      boolean;
    leadInstagram:  Instagram | null;
    replies:       GetCommentReply[];
    instagramPost?: InstagramPost;
}

export interface GetCommentReply {
    id:             string;
    createDate:     string;
    updateDate:     string;
    text:           string;
    mediaId:        string;
    commentId:      string;
    time:           string;
    fromAdmin:      boolean;
    leadInstagram:  Instagram | null;
    replies:       GetComment[];
    instagramPost?: InstagramPost;
    instagram?:     Instagram;
}

export interface GetCommentInstagram {
    instagram: Instagram;
}

export interface Instagram {
    id:             string;
    username:       string;
    profilePicture: ProfilePicture;
}

export interface ProfilePicture {
    url: string;
}


export interface Instagram {
    id:             string;
    name?:          string;
    username:       string;
    profilePicture: ProfilePicture;
}

export interface ProfilePicture {
    url: string;
}

export interface InstagramPost {
    id:        string;
    mediaUrl:  null;
    permalink: string;
    caption:   null;
    picture:   Picture;
}

export interface Picture {
    id:  number;
    url: string;
}
