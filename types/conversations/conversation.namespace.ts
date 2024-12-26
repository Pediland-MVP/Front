import { WsConversation } from "./conversation.ws";
import { WsConversations } from "./conversations.ws";
import { WsNewConversation } from "./newConversation.ws";
import { WsNewMessage } from "./newMessage.ws";

export namespace ConversationNamespace {
  export namespace WS {
    export type Conversation = WsConversation;
    export type Conversations = WsConversations;
    export type NewConversation = WsNewConversation;
    export type NewMessage = WsNewMessage;
  }
}

export enum MemeType {
  ImageJPEG = "image/jpeg",
}

export enum From {
  Instagram = "instagram",
  Lead = "lead",
}

export enum MessageType {
  Text = "text",
}
