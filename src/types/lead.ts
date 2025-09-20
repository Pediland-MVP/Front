import { InstagramNamespace } from "./instagram";
import { Meta } from "./meta";



export namespace leadNamespace  {
    export interface Lead {
        id:            string;
        createDate:    Date;
        updateDate:    Date;
        firstname:     string;
        lastname:      null;
        profilePic:    string;
        instagram:     Instagram;
        leadInstagram: LeadInstagram;
    }

    export interface LeadInstagram {
        id:                      string;
        createDate:              Date;
        updateDate:              Date;
        name:                    string;
        username:                string;
        profilePicture:          {
            url?: string;
        };
        is_verified_user:        boolean;
        follower_count:          number;
        is_user_follow_business: boolean;
        is_business_follow_user: boolean;
        PSID:                    string;
    }

    export interface GET {
        One: Lead
    }
}


export interface Instagram {
    id:                string;
    createDate:        Date;
    updateDate:        Date;
    instagramId:       string;
    facebookAccountId: string;
    facebookPageId:    string;
    name:              string;
    firstname:         string;
    lastname:          string;
    email:             null;
    username:          string;
    profileUrl:        string;
    profilePictureUrl: string;
    allowFirstLeads:   boolean;
}
