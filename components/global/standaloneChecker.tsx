"use client";

import { useInstallPrompt } from "./useInstallPrompt";
import { isStandalone } from "@/lib/isStandalone";
import { } from 'cookie';

export function StandaloneChecker({ children }: { children: React.ReactNode }) {
  const { deferredPrompt, promptInstall } = useInstallPrompt();
  const isInstalled = isStandalone();

  // useEffect(() => {
  //   const run = async () => {
  //     if (isInstalled || !deferredPrompt) {
  //       return;
  //     }

  //     await promptInstall();
  //   };
  //   run();
  // }, [deferredPrompt, isInstalled]);

  return children;
}
