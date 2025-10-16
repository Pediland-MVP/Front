"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingLogo } from "../Global";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { isOnboarding, hasInstagram, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    let redirect: string | null = null;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingPage = pathname === "/auth/onboarding";
    const isConnectPage = pathname === "/connect";
    const isInstagramPage = pathname === "/settings/instagram";

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) redirect = "/";
      else setIsAllowed(true);
    } else if (isConnectPage) {
      if (hasInstagram) redirect = "/";
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
    return <LoadingLogo />;
  }

  return <>{children}</>;
}
