import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export function useAuthApi() {
  const router = useRouter();
  const { setAuth, logout } = useAuthStore();

  const refreshToken = async () => {
    try {
      const res = await fetch("/api/refresh-token", { credentials: "include" });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setAuth({
        isLoggedIn: true,
        isOnboarding: data.status === "onboarding",
        isConnected: data.instagramConnected,
        token: data.token,
      });
      return true;
    } catch {
      logout();
      router.replace("/auth");
      return false;
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        const ok = await refreshToken();
        if (!ok) return;
        return fetchProfile();
      }
      const data = await res.json();
      setAuth({
        isLoggedIn: true,
        isOnboarding: data.status === "onboarding",
        isConnected: data.instagramConnected,
      });
    } catch (e) {
      logout();
      router.replace("/auth");
    }
  };

  return { refreshToken, fetchProfile };
}
