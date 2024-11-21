// app/(Console)/auth/layout/authButtons.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/theme/ui/button";
import { Keyhole, UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

export default function AuthButtons() {
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
            ثبت نام
          </Link>
        </Button>
      )}
      {(currentPath === "/auth/signup" || currentPath === "/auth/reset") && (
        <Button asChild variant="link">
          <Link href="/auth/signin">
            <Keyhole size={22} />
            حساب کاربری
          </Link>
        </Button>
      )}
    </div>
  );
}
