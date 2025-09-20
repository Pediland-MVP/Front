"use client";

import { create } from "zustand";
import { ReactNode } from "react";

type State = {
  tools: ReactNode | null;
  buttons: ReactNode | null;
};

type Actions = {
  setTools: (v: ReactNode | null) => void;
  clearTools: () => void;
  setButtons: (v: ReactNode | null) => void;
  clearButtons: () => void;
  reset: () => void;
};

export const useHeaderFeatures = create<State & Actions>((set) => ({
  tools: null,
  buttons: null,
  setTools: (v) => set({ tools: v }),
  clearTools: () => set({ tools: null }),
  setButtons: (v) => set({ buttons: v }),
  clearButtons: () => set({ buttons: null }),
  reset: () => set({ tools: null, buttons: null }),
}));
