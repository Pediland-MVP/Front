"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
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

  const { isOnboarding, hasInstagram, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;

    let redirect: string | null = null;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingPage = pathname === "/auth/onboarding";
    const isConnectPage = pathname === "/connect";

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) redirect = "/";
      else setIsAllowed(true);
    } else if (isConnectPage) {
      if (hasInstagram) redirect = "/";
      else if (isOnboarding) redirect = "/auth/onboarding";
      else setIsAllowed(true);
    } else {
      if (isOnboarding) redirect = "/auth/onboarding";
      else if (!hasInstagram) redirect = "/connect";
      else setIsAllowed(true);
    }

    if (redirect) router.push(redirect);
  }, [isOnboarding, isUserLoading, pathname]);

  if (!isAllowed) {
    // return <>Not Allowed ⛔</>;
    return <LoadingLogo />;
  }

  return <>{children}</>;
}
