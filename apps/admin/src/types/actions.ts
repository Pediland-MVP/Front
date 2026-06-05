// src/types/actions.ts

export type Action = {
  id: string;
  createDate: string;
  updateDate: string;
  actionDate: string;
  for: string;
  type: string;
  description: string;
  status: string;
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
};
