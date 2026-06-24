// src/types/subscription.ts

export enum SubscriptionStatusEnum {
  PENDING = "pending",
  RESERVED = "reserved",
  ACTIVE = "active",
  CANCELLED = "cancelled",
  FAILED = "failed",
  EXPIRED = "expired",
  PEND_FOR_ACTIVATOR = "pendForActivator",
}

export type PlanDuration = {
  id: number;
  name: string;
  price: number;
  monthlyDiscount: number;
  durationDays: number;
  planId: number;
};

export type PlanResponse = {
  code: string;
  data: Plan[];
  message: string;
  statusCode: number;
};

export type Plan = {
  createDate: Date;
  description: string;
  features: string[];
  id: number;
  isActive: boolean;
  isVisible: boolean;
  maxFollowers: number;
  minFollowers: number;
  name: string;
  type: string;
  updateDate: Date;
  durations?: Duration[];
};

export type DurationResponse = {
  code: string;
  data: Duration[];
  message: string;
  statusCode: number;
};

export type Duration = {
  createDate: Date;
  credit: number;
  durationDays: number;
  id: number;
  monthlyDiscount: number;
  name: string;
  planId: number;
  price: number;
  updateDate: Date;
};

export type Invoice = {
  id: number;
  amount: number;
  status: string;
  createDate: string;
  paymentMethod: string;
};

export type Subscription = {
  id: string;
  status: SubscriptionStatusEnum;
  expire: string;
  createDate: string;
  updateDate: string;
  planDurationId: number;
  planDuration: PlanDuration & {
    plan: Plan;
  };
  invoices: Invoice[];
  // A subscription belongs to a workspace; the customer is the workspace owner
  // and the Instagram accounts hang off the workspace (not the user).
  workspace: {
    id: string;
    name: string;
    owner: {
      id: string;
      firstname: string;
      lastname: string;
      mobile: string;
      usersAdmins: SubscriptionUsersAdmin[];
    } | null;
    instagrams: {
      id: string;
      username: string;
      name: string;
      followersCount: number;
      followsCount: number;
      mediaCount: number;
    }[];
  } | null;
};

type UUID = string;
type ISODateString = string;

export interface Admin {
  id: UUID;
  createDate: ISODateString;
  updateDate: ISODateString;
  deleteDate: ISODateString | null;
  firstname: string;
  lastname: string;
  role: 'admin' | string;
  username: string;
  telegramId: string | null;
}

export interface SubscriptionUsersAdmin {
  id: UUID;
  createDate: ISODateString;
  updateDate: ISODateString;
  isActive: boolean;
  admin: Admin;
  adminId: UUID;
  userId: UUID;
}
