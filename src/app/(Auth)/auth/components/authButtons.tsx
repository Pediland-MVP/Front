// app/(Console)/auth/layout/authButtons.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Keyhole, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export default function AuthButtons() {
  const t = useTranslations("Auth");
  const [currentPath, setCurrentPath] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  return (
    <div className="_auth-buttons flex items-center">
      {currentPath === "/auth/signin" && (
        <Button asChild variant="link">
          <Link href="/auth/signup">
            <UserCirclePlus size={22} />
            {t("signup")}
          </Link>
        </Button>
      )}
      {(currentPath === "/auth/signup" || currentPath === "/auth/reset") && (
        <Button asChild variant="link">
          <Link href="/auth/signin">
            <Keyhole size={22} />
            {t("signin")}
          </Link>
        </Button>
      )}
    </div>
  );
}
