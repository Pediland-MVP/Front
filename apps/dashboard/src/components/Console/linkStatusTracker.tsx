"use client";

import { useEffect } from "react";

interface LinkStatusTrackerProps {
  setIsNavigationPending?: React.Dispatch<React.SetStateAction<boolean>>;
}
export function LinkStatusTracker({
  setIsNavigationPending,
}: LinkStatusTrackerProps) {
  //   const { pending } = useLinkStatus();
  //   useEffect(() => {
  //     if (typeof setIsNavigationPending !== "function") return;
  //     setIsNavigationPending(pending);
  //   }, [pending]);

  return null;
}
