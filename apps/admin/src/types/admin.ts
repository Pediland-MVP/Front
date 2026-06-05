// src/types/admin.ts
export type MarketingLeadsAdmins = {
  id: string;
  createDate: string;
  updateDate: string;
  isActive: boolean;
  admin: {
    id: string;
    createDate: string;
    updateDate: string;
    deleteDate: string;
    firstname: string;
    lastname: string;
    role: string;
    username: string;
  };
  adminId: string;
  marketingLeadId: string;
};
