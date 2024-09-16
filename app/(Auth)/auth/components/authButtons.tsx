// app/(Console)/auth/layout/authButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Keyhole, UserCirclePlus } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthButtons() {
  const [currentPath, setCurrentPath] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    setCurrentPath(pathname);
  }, [pathname]);

  return (
    <div className="_back flex items-center gap-1 text-gray-400 hover:text-gray-700 duration-300">
      {currentPath === "/auth/signin" && (
        <Button asChild variant="ghost">
          <Link href="/auth/signup"><UserCirclePlus size={24} weight="light" className="ml-2" />ثبت نام</Link>
        </Button>
      )}
      {(currentPath === "/auth/signup" || currentPath === "/auth/reset") && (
        <Button asChild variant="ghost">
          <Link href="/auth/signin"><Keyhole size={24} weight="light" className="ml-2" />حساب کاربری</Link>
        </Button>
      )}
    </div>
  );
}