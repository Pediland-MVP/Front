import { create } from 'zustand';

type State = {
  isOpen: boolean;
  /** Where to continue once the dialog is saved — the create URL the user was heading to. */
  pendingHref: string | null;
};

type Actions = {
  open: (href: string) => void;
  close: () => void;
};

export const useBusinessInfoGateStore = create<State & Actions>((set) => ({
  isOpen: false,
  pendingHref: null,
  open: (href) => set({ isOpen: true, pendingHref: href }),
  close: () => set({ isOpen: false, pendingHref: null }),
}));
