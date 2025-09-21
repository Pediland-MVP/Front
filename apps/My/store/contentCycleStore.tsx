'use client'

import { create } from "zustand";

interface ContentStore {
  adminContentCycle: any[];
  setAdminContentCycle: (content: any[]) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  adminContentCycle: [],
  setAdminContentCycle: (content) => set({ adminContentCycle: content }),
}));

interface textStore {
  currentTextAreaValue: string;
  setCurrentTextAreaValue: (content: string) => void;
}

export const useCurrentTextAreaValue = create<textStore>((set) => ({
  currentTextAreaValue: "",
  setCurrentTextAreaValue: (content) => set({ currentTextAreaValue: content }),
}));
