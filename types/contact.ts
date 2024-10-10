
export namespace ContactNamespace {
    export interface GET {
        items: Contact[];
        meta:  Meta;
    }
    export interface Contact {
        lead:              Lead;
        id:                string;
        createDate:        Date;
        updateDate:        Date;
        firstname:         null;
        lastname:          null;
        mobile:            null;
        email:             null;
        country:           null;
        city:              null;
        gender:            null;
        birthDate:         null;
        messagesCount:     string;
        latestMessageDate: Date;
    }
    
    export type Contacts = Contact[]
}

export interface Lead {
    id:              string;
    createDate:      Date;
    updateDate:      Date;
    firstname:       string;
    lastname:        null;
    profilePic:      null | string;
    userId:          string;
    instagramId:     string;
    leadInstagramId: string;
    contactId:       string;
}

export interface Meta {
    currentPage:  number;
    itemCount:    number;
    itemsPerPage: number;
    totalItems:   number;
    totalPages:   number;
}
