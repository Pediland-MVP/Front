import { create } from "zustand";

type State = {
  selectedIds: string[];
};

type Actions = {
  setSelectedIds: (ids: string[]) => void;
};

export const useInstagramFilterStore = create<State & Actions>((set) => ({
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
}));
