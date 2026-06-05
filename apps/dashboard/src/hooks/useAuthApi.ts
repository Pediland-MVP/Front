import { useRouter } from "next/navigation";
import { useLogout } from "./swr/api-client";

export function useAuthApi() {
  const router = useRouter();
  const logout = useLogout();

  const refreshToken = async () => {
    try {
      const res = await fetch("/api/refresh-token", { credentials: "include" });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
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
      if (res.status === 401) {
        const ok = await refreshToken();
        if (!ok) return;
        return fetchProfile();
      }
      const data = await res.json();
    } catch (e) {
      logout();
      router.replace("/auth");
    }
  };

  return { refreshToken, fetchProfile };
}
