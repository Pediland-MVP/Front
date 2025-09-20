export interface WsMessageSent {
    messageId:   string;
    sendDate:    string;
    from:        string;
    text:        string;
    messageType: string;
    instagram:   Instagram;
    lead:        Lead;
    attachment:  null;
    postId:      null;
    id:          string;
    createDate:  Date;
    updateDate:  Date;
    digest:      number;
}

export interface Instagram {
    id:                string;
    createDate:        Date;
    updateDate:        Date;
    igToken:           string;
    igTokenExpireDate: Date;
    followersCount:    number;
    followsCount:      number;
    mediaCount:        number;
    igId:              string;
    instagramId:       string;
    facebookAccountId: null;
    facebookPageId:    null;
    name:              string;
    firstname:         null;
    lastname:          null;
    email:             null;
    username:          string;
    profileUrl:        null;
    profilePictureUrl: string;
    allowFirstLeads:   boolean;
}

export interface Lead {
    id:            string;
    createDate:    Date;
    updateDate:    Date;
    firstname:     string;
    lastname:      null;
    profilePic:    string;
    user:          User;
    instagram:     Instagram;
    leadInstagram: LeadInstagram;
}

export interface LeadInstagram {
    id:                   string;
    createDate:           Date;
    updateDate:           Date;
    ASID:                 string;
    isAdmin:              boolean;
    lastUpdate:           Date;
    name:                 string;
    username:             string;
    isVerifiedUser:       boolean;
    followerCount:        number;
    isUserFollowBusiness: boolean;
    isBusinessFollowUser: boolean;
    PSID:                 null;
}

export interface User {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   string;
    gender:     string;
    birthDate:  Date;
    verified:   boolean;
    email:      null;
    mobile:     string;
}
