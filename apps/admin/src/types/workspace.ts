import { SubscriptionStatusEnum } from '@/types/subscription';
import { AssignedLabel } from '@/types/label';

export type WorkspaceListSubscriptionStatus = 'active' | 'expired' | 'none';

export type WorkspaceOwner = {
  id: string;
  name: string;
  mobile: string | null;
};

export type WorkspaceRow = {
  id: string;
  name: string;
  isPersonal: boolean;
  owner: WorkspaceOwner;
  membersCount: number;
  subscriptionStatus: WorkspaceListSubscriptionStatus;
  createDate: string;
  labels?: AssignedLabel[];
};

export type WorkspaceMemberPermission = {
  slug: string;
  description: string;
};

export type WorkspaceMember = {
  userId: string;
  name: string;
  mobile: string | null;
  role: 'owner' | 'member';
  status: string;
  joinedAt: string;
  permissions: WorkspaceMemberPermission[];
};

export type WorkspaceSubscription = {
  status: SubscriptionStatusEnum;
  expire: string;
  payDate: string | null;
  plan: { name: string } | null;
  planDuration: { name: string; price: number; durationDays: number } | null;
};

export type WorkspaceInstagram = {
  id: string;
  username: string;
  name: string | null;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
};

export type WorkspaceDetail = {
  meta: {
    id: string;
    name: string;
    description: string | null;
    isPersonal: boolean;
    createDate: string;
    owner: WorkspaceOwner;
  };
  members: WorkspaceMember[];
  subscription: WorkspaceSubscription | null;
  resourceCounts: {
    instagrams: number;
    leads: number;
    products: number;
    orders: number;
  };
  instagrams: WorkspaceInstagram[];
};
