'use client';

import { useRouter } from 'next/navigation';
import useUser from '@/hooks/useUser';
import { useBusinessInfoGateStore } from '@/lib/stores/useBusinessInfoGateStore';

/**
 * Gate in front of every "create automation" entry point.
 *
 * We ask «چطور با بفروش آشنا شدید؟» once, the first time the user acts on creating an
 * automation, and never again once the field holds a value. The question is deliberately
 * absent from /settings/profile — this dialog is its only collection point.
 *
 * A half-loaded or failed `/users/me` never gates. Blocking on an answer we do not have
 * would trap the user behind a dialog for a reason that is our fault, and the cost of
 * guessing wrong is only that we ask on their next create instead.
 *
 * Every entry point must route through `startAutomationCreate` rather than navigating on
 * its own, or the gate silently leaks — there are six of them, and they are easy to miss.
 */
export function useBusinessInfoGate() {
  const router = useRouter();
  const { user, isLoading, error } = useUser();
  const open = useBusinessInfoGateStore((s) => s.open);

  const needsBusinessInfo = !isLoading && !error && !!user && !user.howFoundUs;

  const startAutomationCreate = (href: string) => {
    if (needsBusinessInfo) {
      open(href);
      return;
    }
    router.push(href);
  };

  return { needsBusinessInfo, startAutomationCreate };
}
