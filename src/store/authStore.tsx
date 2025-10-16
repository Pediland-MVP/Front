import { create } from "zustand";
// import { getAccessToken } from "@/hooks/swr/api-client";

type AuthState = {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  // isOnboarding?: boolean;
  // isConnected?: boolean;
  // token: string | null;
  // loading: boolean;
  // hydrated: boolean;
  // bootstrap: (
  //   initialAuth?: Partial<AuthState>,
  //   options?: { sync?: boolean },
  // ) => void;
  // setAuth: (auth: Partial<AuthState>) => void;
  // logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (isLoggedIn: boolean) => set({ isLoggedIn }),
  
  // isOnboarding: false,
  // isConnected: false,
  // token: null,
  // loading: true,
  // hydrated: false,

  // 🧠 Bootstrap (SSR + CSR sync)
  // bootstrap: (
  //   initialAuth?: Partial<AuthState>,
  //   options?: { sync?: boolean },
  // ) => {
  //   const token = getAccessToken();

  //   const nextState: Partial<AuthState> = {
  //     isLoggedIn: !!(token || initialAuth?.isLoggedIn),
  //     token: token ?? initialAuth?.token ?? null,
  //     isOnboarding: initialAuth?.isOnboarding ?? false,
  //     isConnected: initialAuth?.isConnected ?? false,
  //     loading: false,
  //     hydrated: true,
  //   };

  //   if (options?.sync) {
  //     // ✅ synchronous bootstrap (برای SSR hydration)
  //     set(nextState as AuthState);
  //     return;
  //   }

  //   // ✅ async (برای client mount)
  //   requestAnimationFrame(() => set(nextState as AuthState));
  // },

  // setAuth: (auth) => set((state) => ({ ...state, ...auth })),


  // logout: () => {
  //   set({
  //     isLoggedIn: false,
  //     token: null,
  //     hydrated: true,
  //     loading: false,
  //   });
  // },
}));
