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
  toUser?: { firstname: string; lastname: string; mobile: string; email?: string | null };
  // Only present when status is 'pending_otp' — seconds until a resend is
  // accepted, so a dialog resuming into the OTP step can show the resend
  // button's real state instead of a stale/optimistic 0.
  resendCooldownSeconds?: number;
}
