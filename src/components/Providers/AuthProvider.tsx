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

    if (pathname === "/connect") {
      if (!isOnboarding) {
        return router.push("/auth/onboarding");
      }

      if (hasInstagram) {
        return router.push("/");
      }
      return;
    }

    if (!isOnboarding) {
      return setIsAllowed(true);
    }

    if (!hasInstagram) {
      return router.push("/connect");
    }
    router.push("/auth/onboarding");
  }, [isOnboarding, isUserLoading]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
