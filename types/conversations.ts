export interface WsConversations {
    items: Item[];
    meta:  Meta;
}

export interface Item {
    id:            string;
    createDate:    Date;
    updateDate:    Date;
    firstname:     null | string;
    lastname:      null;
    profilePic:    null | string;
    leadInstagram: LeadInstagram;
    messages:      Message[];
}

export interface LeadInstagram {
    id:                   string;
    createDate:           Date;
    updateDate:           Date;
    ASID:                 string;
    isAdmin:              boolean;
    lastUpdate:           Date;
    name:                 null | string;
    username:             string;
    isVerifiedUser:       boolean;
    followerCount:        number;
    isUserFollowBusiness: boolean;
    isBusinessFollowUser: boolean;
    PSID:                 null;
    profilePicture:       ProfilePicture | null;
}

export interface ProfilePicture {
    id:          number;
    createDate:  Date;
    updateDate:  Date;
    memeType:    MemeType;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
}

export enum MemeType {
    ImageJPEG = "image/jpeg",
}

export interface Message {
    id:          string;
    createDate:  Date;
    updateDate:  Date;
    messageId:   string;
    attachment:  null;
    sendDate:    string;
    from:        From;
    postId:      null;
    text:        null | string;
    messageType: MessageType;
}

export enum From {
    Instagram = "instagram",
    Lead = "lead",
}

export enum MessageType {
    Text = "text",
}

export interface Meta {
    currentPage:  number;
    itemCount:    number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
