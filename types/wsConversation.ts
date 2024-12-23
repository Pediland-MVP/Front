export interface WsConversation {
    items: WsConversationItem[];
    meta:  Meta;
}

export interface WsConversationItem {
    id:          string;
    createDate:  string;
    updateDate:  string;
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
