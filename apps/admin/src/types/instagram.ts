// src/lib/instagram.ts

import { AssignedLabel } from '@/types/label';

export type InstagramRow = {
  id: string;
  username: string;
  name: string | null;
  followersCount: number;
  isIgTokenValid: boolean;
  workspace: { id: string; name: string };
  owner: { id: string; name: string; mobile: string | null };
  labels?: AssignedLabel[];
};

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
