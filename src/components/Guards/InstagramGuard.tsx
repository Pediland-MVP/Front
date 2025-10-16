"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingLogo } from "@components";

export const InstagramGuard = ({ children }: { children: React.ReactNode }) => {
  // const router = useRouter();
  // const pathname = usePathname();
  // const { hasInstagram, isLoading: isUserLoading } = useUser();
  // const [isPageShow, setIsPageShow] = useState(false);

  // useEffect(() => {
  //   if (isUserLoading || !pathname || !router) {
  //     return;
  //   }

  //   const isConnectPage = pathname === "/connect";
  //   if (!isConnectPage && !hasInstagram) {
  //     return router.push("/connect");
  //   }

  //   setIsPageShow(true);
  // }, [hasInstagram, isUserLoading, pathname, router]);

  // if (isUserLoading) {
  //   return <LoadingLogo />;
  // }

  // if (!isPageShow) {
  //   return null;
  // }

  return <>{children}</>;
};
