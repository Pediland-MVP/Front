export interface WsConversations {
    items: Item[];
    meta:  Meta;
}

export interface Item {
    id:            string;
    createDate:    Date;
    updateDate:    Date;
    firstname:     string;
    lastname:      null;
    profilePic:    string;
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
    name:                 string;
    username:             string;
    isVerifiedUser:       boolean;
    followerCount:        number;
    isUserFollowBusiness: boolean;
    isBusinessFollowUser: boolean;
    PSID:                 null;
    profilePicture:       ProfilePicture;
}

export interface ProfilePicture {
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

export interface Message {
    id:          string;
    createDate:  Date;
    updateDate:  Date;
    messageId:   string;
    attachment:  null;
    sendDate:    string;
    from:        string;
    postId:      null;
    text:        string;
    messageType: string;
}

export interface Meta {
    currentPage:  number;
    itemCount:    number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
