import { GetComment } from "./comment";
import { PostCommentReply } from "./commentReply";
import { GetComments } from "./comments";
import { WsComments } from "./comments.ws";
import { WsNewComment } from "./newComment.ws";

export namespace CommentNamespace {
    export namespace WS {
        export type Comments = WsComments
        export type NewComment = WsNewComment
    }
    
    export namespace GET {
        export type Comments = GetComments
        export type Comment = GetComment
    }
    
    export namespace POST {
        export type Reply = PostCommentReply
    }
}

