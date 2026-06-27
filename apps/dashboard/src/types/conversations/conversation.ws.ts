export interface WsConversation {
  items: WsConversationMessage[];
  meta: Meta;
}

export interface WsConversationMessage {
  id: string;
  createDate: Date;
  updateDate: Date;
  messageId: string;
  attachment: null;
  sendDate: string;
  from: string;
  postId: null;
  text: string;
  messageType: string;
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
