// src/types/customer.ts

import { Category } from "./category";
import { Instagram } from "./instagram";

export type Customer = {
  id: string;
  gender: string | null;
  firstname: string;
  lastname: string;
  mobile?: string | null;
  email?: string | null;
  status: string;
  createDate: string;
  updateDate: string;
  lastActivityDate?: string | null;
  note: string | null;
  submittedInstagramUsername?: string
  usersAdmins: {
    admin: {
      id: string;
      firstname: string;
      lastname: string;
      role: string;
    };
    isActive: boolean;
  }[];

  city: string | null;

  category: Category | null;

  subscriptions: {
    id: string;
    status: string;
    expire: string;
    createDate: string;
    planDurationId: number;
    planDuration: {
      id: number;
      name: string;
      price: number;
      monthlyDiscount: number;
      durationDays: number;
      planId: number;
      plan: {
        id: number;
        name: string;
        description: string;
        minFollowers: number;
        maxFollowers: number;
        features: string[];
        isActive: boolean;
        isVisible: boolean;
      };
    };
    invoices: {
      id: number;
      amount: number;
      status: string;
      createDate: string;
      paymentMethod: string;
    }[];
  }[];

  instagrams: Instagram[];

  stats: {
    totalFollowers: number;
    leadCount: number;
    automationCount: number;
    sessionCount: number;
    productCount: number;
    orderCount: number;
    salesCount: number;
    totalSale: number;
    totalActiveSalesAmount: number;
  };

  referralUser: {
    id: string;
    usage: number;
    totalUsage: number;
    codeChanges: number;
    referralCode: {
      id: string;
      code: string;
      discount: number;
      type: string;
      user: {
        id: string;
        firstname: string;
        lastname: string;
        mobile: string;
      };
    };
  };
};
