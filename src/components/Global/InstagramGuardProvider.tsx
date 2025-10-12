"use client";

import useUser from "@/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingLogo } from "@components";

export const InstagramGuardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { hasInstagram, isLoading } = useUser();
  const [pageShow, setPageShow] = useState(false);

  useEffect(() => {
    if (isLoading || !pathname || !router) {
      return;
    }

    const isConnectPage = pathname === "/connect";

    if (hasInstagram) {
      if (isConnectPage) {
        router.push("/");
      } else {
        setPageShow(true);
      }
    } else {
      if (isConnectPage) {
        setPageShow(true);
      } else {
        router.push("/connect");
      }
    }
  }, [hasInstagram, isLoading, pathname, router]);

  if (isLoading) {
    return <LoadingLogo />;
  }

  if (!pageShow) {
    return null;
  }

  return <>{children}</>;
};
