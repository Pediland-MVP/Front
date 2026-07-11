export type OwnershipTransferMode = 'leave' | 'stay';

export interface IncomingTransfer {
  id: string;
  mode: OwnershipTransferMode;
  status: string;
  workspace: { id: string; name: string };
  fromUser: { firstname: string; lastname: string };
}

export interface ActiveTransfer {
  id: string;
  mode: OwnershipTransferMode;
  status: string;
  toUser?: { firstname: string; lastname: string; mobile: string };
}
