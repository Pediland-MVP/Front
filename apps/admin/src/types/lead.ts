// src/types/lead.ts

import { MarketingLeadsAdmins } from './admin';
import { Category } from './category';
import { Instagram } from './instagram';

export type MarketingLead = {
  id: string;
  createDate: string;
  updateDate: string;
  note: string;
  status: MarketingLeadStatusEnum;
  firstname: string;
  lastname: string;
  mobile: string;
  categoryId: number;
  instagram: Instagram;
  marketingLeadsAdmins: MarketingLeadsAdmins[];
  category: Category;
};

export enum MarketingLeadStatusEnum {
  INCOMING = 'incoming',
  FOLLOW = 'follow',
  FORCE = 'force',
  FAILED = 'failed',
  SUCCESS = 'success',
}
