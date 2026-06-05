import { create } from "zustand";
import { ReactNode } from "react";

type State = {
  tools: ReactNode | null;
  buttons: ReactNode | null;
  error: boolean;
};

type Actions = {
  setButtons: (v: ReactNode | null) => void;
  clearButtons: () => void;
  setTools: (v: ReactNode | null) => void;
  clearTools: () => void;
  setError: (v: boolean) => void;
  reset: () => void;
};

export const useHeaderFeatures = create<State & Actions>((set) => ({
  tools: null,
  buttons: null,
  error: false,
  setTools: (v) => set({ tools: v }),
  clearTools: () => set({ tools: null }),
  setButtons: (v) => set({ buttons: v }),
  clearButtons: () => set({ buttons: null }),
  setError: (v) => set({ error: v }),
  reset: () => set({ tools: null, buttons: null, error: false }),
}));
