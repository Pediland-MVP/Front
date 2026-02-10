"use client";
import useUser from "@/hooks/useUser";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InstagramInvalidRedirector() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter()
  useEffect(() => {
    // When user is in settings/isntagram it's maybe redirected from relogin
    // So We shouldn't show this message to that
    if (pathname.startsWith("/settings/instagram")) return;
    if (pathname.startsWith('/help')) return;
    if (pathname.startsWith('/learn')) return;

    // Show the popup only once when the component mounts
    if (user && user.instagrams) {
      if (
        user.instagrams.find(
          (ig) =>
            ig.isIgTokenValid === false || ig.isIgWebhookSubscribed === false,
        )
      ) {
        router.push('/settings/instagram')
      }
    }
  }, [user, pathname]);

  return null;
}
