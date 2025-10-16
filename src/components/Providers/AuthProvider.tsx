"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: any;
  children: React.ReactNode;
}) {
  const { isLoggedIn, setIsLoggedIn } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Set initial auth state from server
    if (initialAuth?.isLoggedIn !== undefined) {
      setIsLoggedIn(initialAuth.isLoggedIn);
    }
  }, [initialAuth, setIsLoggedIn]);

  useEffect(() => {
    // Redirect to home if user is logged in
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  return <>{children}</>;
}
