"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageViewReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    // GA4 recommended page_view event
    // @ts-ignore
    window.gtag?.("event", "page_view", {
      page_location: window.location.origin + url,
      page_path: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}
