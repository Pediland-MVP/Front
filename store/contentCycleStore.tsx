// import { create } from "zustand";

// interface ContentStore {
//   contentCycle: string[];
//   setContentCycle: (content: string[]) => void;
// }

// export const useContentStore = create<ContentStore>((set) => ({
//   contentCycle: [],
//   setContentCycle: (content) => set({ contentCycle: content }),
// }));



import { create } from "zustand";

interface ContentStore {
  adminContentCycle: string[];
  setAdminContentCycle: (content: string[]) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  adminContentCycle: [],
  setAdminContentCycle: (content) => set({ adminContentCycle: content }),
}));


