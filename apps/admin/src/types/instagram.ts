// src/lib/instagram.ts

export type Instagram = {
  id: string;
  createDate: string;
  updateDate: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  name: string | null;
  username: string;
  isIgTokenValid: boolean;
};
