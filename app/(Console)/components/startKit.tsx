"use client";
import { Button } from "@/components/theme/ui/button";
import useUser from "@/hooks/useUser";
import { Basket, Play, Plug } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef, useState } from "react";
import DiscountText from "@/components/discountText";
import { cn } from "@/lib/utils";
import useConnectInstagram from "@/hooks/useConnectInstagram";
import { useRouter } from "next/navigation";
// import '@vidstack/react/player/styles/base.css';

type StartKitProps = {
  isAfterPurchasingPlan?: boolean;
};

export default function StartKit({ isAfterPurchasingPlan }: StartKitProps) {
  const { hasSubscription, hasInstagram, isLoading, error, user } = useUser();
  const [isPlaying, setIsPlaying] = useState(false);

  const router = useRouter();

  const { connectIG } = useConnectInstagram();
  const handle = () => {
    if (!hasSubscription) {
      router.push(`/settings/upgrade`);
      return;
    }
    connectIG();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    const video = document.getElementById("welcome-video") as HTMLVideoElement;
    if (video) {
      isPlaying ? video.pause() : video.play();
    }
  };

  return (
    <div className="_startkit-page h-full flex items-center justify-center md:max-w-[480px] mx-auto">
      <div className="p-6">
        <h2 className="font-semibold text-primary mb-1">
          حالا وقت اتصال اینستاگرامه!{" "}
          {isAfterPurchasingPlan && "اشتراکت رو خریدی "}
        </h2>
        <p className="mb-4 text-[15px]">
          حالا باید اکانت اینستاگرام خودتون رو با توجه به این آموزش متصل کنید
        </p>

        <div className="relative aspect-[9/16] w-full max-w-[250px] mx-auto overflow-hidden rounded-lg shadow-md">
          <video
            id="welcome-video"
            className="w-full h-full object-cover"
            poster={"/images/photo_2025-02-26_22-00-50.jpg"}
            src={"https://befroosh.storage.iran.liara.space/IMG_2330.MOV"}
            playsInline
            loop
            controls
          />

          <Button
            className={cn(
              "absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary/80 hover:bg-primary text-white",
              `${isPlaying ? "hidden" : "block"}`
            )}
            onClick={handlePlayPause}
          >
            <Play className={cn(`w-8 h-8`)} />
          </Button>
        </div>
        <DiscountText />
        <div className="text-center">
          <Link
            href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`}
          >
            <Button className="bg-green-500 text-white hover:bg-green-400 mt-4 w-full">
              <>
                <Plug weight="duotone" className="w-5 h-5" />
                اتصال اکانت
              </>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
