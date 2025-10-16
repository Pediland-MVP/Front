"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

    if (pathname.startsWith("/auth")) {
      if (pathname === "/auth/onboarding") {
        if (!isOnboarding) {
          return router.push("/");
        }

        return setIsAllowed(true);
      }

      return setIsAllowed(true);
    }

    if (pathname === "/connect") {
      if (hasInstagram) {
        return router.push("/");
      }

      if (isOnboarding) {
        return router.push("/auth/onboarding");
      }

      return setIsAllowed(true);
    }

    if (isOnboarding) {
      return router.push("/auth/onboarding");
    }

    if (!isOnboarding && !hasInstagram) {
      return router.push("/connect");
    }

    return setIsAllowed(true);
  }, [isOnboarding, isUserLoading, pathname]);

  if (!isAllowed) {
    return <>Not Allowed ⛔</>;
  }

  return <>{children}</>;
}
