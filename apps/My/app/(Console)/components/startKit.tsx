// app/(Console)/components/startKit.tsx
"use client";

import useConnectInstagram from "@/hooks/useConnectInstagram";
import useUser from "@/hooks/useUser";
import { cn } from "@befroosh/lib";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// UI Imports
import { Button } from "@befroosh/ui";
import { PlayIcon, PlugIcon } from "@phosphor-icons/react/dist/ssr";
import { DiscountText } from "@/components";

type StartKitProps = {
  isAfterPurchasingPlan?: boolean;
};

export default function StartKit({ isAfterPurchasingPlan }: StartKitProps) {
  const { hasSubscription } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { connectIG } = useConnectInstagram();

  const handleConnect = () => {
    if (!hasSubscription) {
      router.push(`/settings/upgrade`);
      return;
    }
    connectIG();
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="_startkit-page mx-auto flex h-full flex-1 items-center justify-center md:max-w-[480px]">
      <div className="p-5">
        <h2 className="text-primary mb-1.5 font-semibold">
          حالا وقت اتصال اینستاگرامه!{" "}
          {isAfterPurchasingPlan && "اشتراکت رو خریدی "}
        </h2>
        <p className="mb-4 text-sm">
          حالا باید اکانت اینستاگرام خودتون رو با توجه به این آموزش متصل کنید.
        </p>

        <div className="relative mx-auto aspect-[9/16] w-full max-w-[250px] overflow-hidden rounded-lg shadow-md">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster="/images/photo_2025-02-26_22-00-50.jpg"
            src="https://befroosh.storage.iran.liara.space/IMG_2330.MOV"
            playsInline
            loop
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {!isPlaying && (
            <Button
              className="bg-primary/80 hover:bg-primary absolute left-1/2 top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white"
              size="icon"
              onClick={handlePlayPause}
            >
              <PlayIcon className="size-6" />
            </Button>
          )}
        </div>

        <DiscountText />

        <div className="text-center">
          <Link
            href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`}
          >
            <Button className="mt-4 w-full bg-green-500 text-white hover:bg-green-400">
              <>
                <PlugIcon weight="duotone" className="h-5 w-5" />
                اتصال اکانت
              </>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
