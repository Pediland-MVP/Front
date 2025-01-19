import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";

export interface IContentCycle {
    id:                 string;
    createDate:         Date;
    updateDate:         Date;
    title:              string;
    isDirect:           boolean;
    isComment:          boolean;
    commentStartText:   string | undefined;
    commentStartTitle:  string | undefined
    ;
    justFollowers:      boolean;
    followCheckMessage: null;
    followMessage:      null;
    likeDirect:         boolean;
    cta:                string | undefined;
    haveCta:            boolean;
    isContentsEnabled:  boolean;
    conditions:         Condition[];
    contents:           Content[];
    reminder:           Reminder;
    getUserData:        GetUserData;
}

interface Condition {
    id:         string;
    createDate: Date;
    updateDate: Date;
    type:       string;
    value:      string;
}

interface Content {
    id:              string;
    createDate:      Date;
    updateDate:      Date;
    text:            undefined | string;
    consentText:     string | undefined;
    haveConsent:     boolean;
    step:            number;
    type:            ContentCycleContentTypesEnum;
    contentProducts: ContentProduct[];
    file:            File | null;
    instagramPost:   InstagramPost | null;
}

interface ContentProduct {
    id:         string;
    createDate: Date;
    updateDate: Date;
    priority:   number;
    product:    Product;
}

interface Product {
    id:     string;
    title:  string;
    images: Picture[];
}

interface Picture {
    id:  number;
    url: string;
}

interface File {
    id:       number;
    mimeType: string;
    name:     string;
    url:      string;
}

interface InstagramPost {
    id:        string;
    mediaId:   string;
    mediaType: string;
    mediaUrl:  string;
    picture:   Picture;
}

interface GetUserData {
    id:      string;
    enabled: boolean;
    type:    "email" | "mobile" | undefined;
    text:    string;
}

interface Reminder {
    id:         string;
    createDate: Date;
    updateDate: Date;
    isEnabled:  boolean;
    isSent:     boolean;
    sentDate:   null;
    text:       string;
    time:       string;
}
