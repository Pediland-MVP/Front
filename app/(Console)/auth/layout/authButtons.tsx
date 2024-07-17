// app/(Console)/auth/layout/authButtons.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { Lock, UserCirclePlus } from "@phosphor-icons/react";
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
      {currentPath === "/auth/login" && (
        <Button
          as={Link}
          href="/auth/signup"
          className="pr-4"
          variant="light"
          size="lg"
          radius="full"
          startContent={<UserCirclePlus size={20} />}
        >
          ثبت نام
        </Button>
      )}
      {(currentPath === "/auth/signup" || currentPath === "/auth/reset") && (
        <Button
          as={Link}
          href="/auth/login"
          className="pr-4"
          variant="light"
          size="lg"
          radius="full"
          startContent={<Lock size={20} />}
        >
          ورود
        </Button>
      )}
    </div>
  );
}
