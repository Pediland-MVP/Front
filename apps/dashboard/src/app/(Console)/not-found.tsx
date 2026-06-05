"use client";

import "@/styles/globals.css";
import {
  ArrowLeftIcon,
  FlyingSaucerIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="font-Yekan flex h-screen flex-col items-center justify-center gap-5 bg-linear-to-t from-violet-200 to-blue-200 antialiased"
      dir="rtl"
    >
      <div>
        <FlyingSaucerIcon
          size={60}
          weight="duotone"
          className="text-primary animate-pulse"
        />
      </div>
      <div className="text-secondary text-xl font-semibold">
        صـفـحـه مـورد نـظـر وجـود نـدارد.
      </div>
      <Link
        href="/"
        className="text-secondary mt-5 flex items-center gap-2 text-sm"
      >
        داشبورد
        <ArrowLeftIcon size={18} />
      </Link>
    </div>
  );
}
