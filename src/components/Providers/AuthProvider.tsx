"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderSpin } from "../ui-custom";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    error,
    isOnboarding,
    hasInstagram,
    isLoading: isUserLoading,
    user,
  } = useUser();

  console.log("Poshtesh............", error);

  useEffect(() => {
    if (isUserLoading) return;

    if (error) {
      if (error.response?.status >= 500) {
        console.log("Error Server:", error);
        router.push("/server-down?isUserOnline");
        return;
      }

      if (error.code === "ERR_NETWORK") {
        console.log("Error Network:", error);
        router.push("/network-down");
        return;
      }
    }

    let redirect: string | null = null;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingPage = pathname === "/auth/onboarding";
    const isConnectPage = pathname === "/connect";
    const isInstagramPage = pathname === "/settings/instagram";

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) redirect = "/";
      else setIsAllowed(true);
    } else if (isConnectPage) {
      if (isInstagramPage && searchParams.get("code")) {
        setIsAllowed(true);
      } else if (hasInstagram) redirect = "/";
      else if (isOnboarding) redirect = "/auth/onboarding";
      else setIsAllowed(true);
    } else {
      if (isOnboarding) redirect = "/auth/onboarding";
      else if (!hasInstagram) {
        if (isInstagramPage && searchParams.get("code")) {
          setIsAllowed(true);
        } else {
          redirect = "/connect";
        }
      } else setIsAllowed(true);
    }

    if (redirect) router.push(redirect);
  }, [isOnboarding, isUserLoading, pathname, searchParams]);

  if (!isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoaderSpin />
      </div>
    );
  }

  return <>{children}</>;
}
