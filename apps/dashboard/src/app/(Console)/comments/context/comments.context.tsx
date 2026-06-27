'use client';
import { commentsSocket } from '@/utils/socket';
import { CommentNamespace } from '@/types/comments/comment.namespace';
import { WsCommentEvents } from '@/types/comments/wsComment.enum';
import { createContext, useContext, useEffect, useState } from 'react';

export type CommentsContextType = {
  comments: CommentNamespace.WS.Comments['items'];
  setComments: React.Dispatch<React.SetStateAction<CommentNamespace.WS.Comments['items']>>;
};

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export const CommentsProvider = ({ children }: { children: React.ReactNode }) => {
  const [comments, setComments] = useState<CommentNamespace.WS.Comments['items']>([]);

  const onNewComment = (data: string) => {
    const comment: CommentNamespace.WS.NewComment = JSON.parse(data);
    setComments((old) => [comment, ...old]);
  };

  useEffect(() => {
    commentsSocket.on(WsCommentEvents.NEW_COMMENT, onNewComment);

    return () => {
      commentsSocket.off(WsCommentEvents.NEW_COMMENT, onNewComment);
    };
  }, []);

  return (
    <CommentsContext.Provider value={{ comments, setComments }}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};
