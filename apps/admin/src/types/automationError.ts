export type AutomationErrorRow = {
  id: string;
  queue: 'sendMessage' | 'replyComment' | 'privateReply';
  title: string;
  description: string;
  code?: number;
  subcode?: number;
  failedAt: string;
  instagram: { id: string; username: string; name: string | null; workspaceId: string } | null;
  payload: unknown;
};
