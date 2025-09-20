export interface WsNewMessage {
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
    user:              User;
    leads:             Lead[];
}

export interface Lead {
    id:         string;
    createDate: Date;
    updateDate: Date;
    firstname:  string;
    lastname:   null;
    profilePic: string;
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
