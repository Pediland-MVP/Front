// src/types/actions.ts

type AdminRef = {
  id: string;
  createDate: string;
  updateDate: string;
  deleteDate: string;
  firstname: string;
  lastname: string;
  role: string;
  username: string;
};

export type Action = {
  id: string;
  createDate: string;
  updateDate: string;
  actionDate: string;
  for: string;
  type: string;
  description: string;
  status: string;
  doneDate?: string | null;
  doneNote?: string | null;
  admin: AdminRef;
  createdByAdmin?: AdminRef | null;
  doneByAdmin?: AdminRef | null;
};
