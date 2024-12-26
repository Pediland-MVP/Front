export interface GetComment {
    id:            string;
    createDate:    string;
    updateDate:    string;
    text:          string;
    mediaId:       string;
    commentId:     string;
    time:          string;
    fromAdmin:     boolean;
    leadInstagram: LeadInstagram;
    replies:       GetComment[];
    instagramPost: InstagramPost;
}

export interface InstagramPost {
    mediaUrl:  string;
    id:        string;
    caption:   string;
    permalink: string;
    picture: Picture;
}

export interface Picture {
    id:          number;
    createDate:  Date;
    updateDate:  Date;
    memeType:    string;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
}


export interface LeadInstagram {
    id:             string;
    name:           string;
    username:       string;
    profilePicture: ProfilePicture;
}

export interface ProfilePicture {
    url: string;
}
