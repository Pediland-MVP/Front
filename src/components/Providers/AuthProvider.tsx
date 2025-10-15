"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoadingLogo } from "@/components/Global";

export default function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: any;
  children: React.ReactNode;
}) {
  const { hydrated, loading, bootstrap } = useAuthStore();
  const [ready, setReady] = useState(false);
  const bootstrapped = useRef(false);

  // ⛔ جلوگیری از دوبار bootstrap (حتی در SSR + CSR)
  if (!bootstrapped.current && !hydrated) {
    bootstrapped.current = true;
    bootstrap(initialAuth, { sync: true });
  }

  useEffect(() => {
    // اطمینان از sync نهایی بعد از mount
    if (!hydrated) bootstrap(initialAuth);
    // وقتی hydrated شد → اجازه‌ی نمایش children
    if (hydrated) setReady(true);
  }, [bootstrap, hydrated, initialAuth]);

  // 🚫 اگر هنوز آماده نیستیم، اصلاً children رو render نکن
  if (!ready || loading || !hydrated) {
    return <LoadingLogo />;
  }

  // ✅ آماده: children بدون فلیکر
  return <>{children}</>;
}
