"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

import { HeartIcon } from "@phosphor-icons/react";

interface LoadingLogoProps {
  delay?: number;
}

export const LoadingLogo = ({ delay = 0 }: LoadingLogoProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        const removeTimer = setTimeout(() => setVisible(false), 500);
        return () => clearTimeout(removeTimer);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setFadeOut(true);
      const removeTimer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(removeTimer);
    }
  }, [delay]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-10 flex h-screen flex-col items-center justify-center bg-gradient-to-tl from-violet-700 to-blue-400 transition-opacity duration-500",
        fadeOut ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="text-center">
        <h2 className="text-white">
          با{" "}
          <HeartIcon
            className="-mt-1 inline-block animate-pulse"
            weight="duotone"
            size={20}
          />
        </h2>
        <h1 className="text-3xl font-semibold text-white">بِـفـروش</h1>
      </div>
    </div>
  );
};
