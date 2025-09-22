"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@befroosh/lib";

import { type IconProps } from "@phosphor-icons/react";
import {
  Button,
  Card,
  CardContent,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@befroosh/ui";
import {
  BarcodeIcon,
  BellRingingIcon,
  CardholderIcon,
  ChatsIcon,
  ChatTextIcon,
  ListStarIcon,
  PackageIcon,
  PlantIcon,
  TelevisionIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";

const ICONS: Record<string, React.ComponentType<IconProps>> = {
  chats: ChatsIcon,
  chat: ChatTextIcon,
  barcode: BarcodeIcon,
  package: PackageIcon,
  users: UsersIcon,
  bell: BellRingingIcon,
  pay: CardholderIcon,
  live: TelevisionIcon,
  form: ListStarIcon,
  plant: PlantIcon,
};

const COLOR_STYLES = {
  cyan: {
    text: "text-cyan-600",
    bg: "bg-cyan-500",
    bgFrom: "from-cyan-300/70",
    bgTo: "to-cyan-900",
  },
  sky: {
    text: "text-sky-600",
    bg: "bg-sky-500",
    bgFrom: "from-sky-300/70",
    bgTo: "to-sky-900",
  },
  blue: {
    text: "text-blue-600",
    bg: "bg-blue-500",
    bgFrom: "from-blue-300/70",
    bgTo: "to-blue-900",
  },
  indigo: {
    text: "text-indigo-600",
    bg: "bg-indigo-500",
    bgFrom: "from-indigo-300/70",
    bgTo: "to-indigo-900",
  },
  violet: {
    text: "text-violet-600",
    bg: "bg-violet-500",
    bgFrom: "from-violet-300/70",
    bgTo: "to-violet-900",
  },
  purple: {
    text: "text-purple-600",
    bg: "bg-purple-500",
    bgFrom: "from-purple-300/70",
    bgTo: "to-purple-900",
  },
  fuchsia: {
    text: "text-fuchsia-600",
    bg: "bg-fuchsia-500",
    bgFrom: "from-fuchsia-300/70",
    bgTo: "to-fuchsia-900",
  },
  pink: {
    text: "text-pink-600",
    bg: "bg-pink-500",
    bgFrom: "from-pink-300/70",
    bgTo: "to-pink-900",
  },
  rose: {
    text: "text-rose-600",
    bg: "bg-rose-500",
    bgFrom: "from-rose-300/70",
    bgTo: "to-rose-900",
  },
};

type ColorName = keyof typeof COLOR_STYLES;

type Feature = {
  id: number;
  title: string;
  icon: keyof typeof ICONS;
  color: ColorName;
  image: string;
  description: string;
};

export const HomeFeatures = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(1); // Default to first feature
  const [carouselApi, setCarouselApi] = useState<any>(null);

  const features: Feature[] = [
    {
      id: 1,
      title: "دایرکت هوشمند",
      icon: "chats",
      color: "cyan",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 2,
      title: "کامنت هوشمند",
      icon: "chat",
      color: "sky",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 3,
      title: "سفارش خودکار",
      icon: "barcode",
      color: "blue",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 4,
      title: "ثبت پستی سریع",
      icon: "package",
      color: "indigo",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 5,
      title: "مدیریت مشتریان",
      icon: "users",
      color: "violet",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 6,
      title: "یادآوری خودکار",
      icon: "bell",
      color: "purple",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 7,
      title: "پرداخت متنوع",
      icon: "pay",
      color: "fuchsia",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 8,
      title: "فروش زنده",
      icon: "live",
      color: "pink",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
    {
      id: 9,
      title: "فرم اختصاصی",
      icon: "form",
      color: "rose",
      image: "sample-feat.png",
      description:
        "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند.",
    },
  ];

  // Sync active feature with carousel selection (arrows/swipe)
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      try {
        const index = carouselApi.selectedScrollSnap?.() ?? 0;
        const f = features[index];
        if (f && f.id !== activeFeature) setActiveFeature(f.id);
      } catch {}
    };

    onSelect();
    carouselApi.on?.("select", onSelect);
    carouselApi.on?.("reInit", onSelect);
    return () => {
      carouselApi.off?.("select", onSelect);
      carouselApi.off?.("reInit", onSelect);
    };
  }, [carouselApi, activeFeature]);

  return (
    <section className="_home-features bg-gradient-to-l from-blue-500 to-violet-600 py-10">
      <div className="container max-w-5xl px-5">
        <div>
          <h2 className="mb-10 text-center text-2xl font-medium text-white">
            امکاناتی که کار شما را ساده‌تر و فروشتان را بیشتر می‌کند.
          </h2>

          <div className="grid grid-cols-3 gap-x-3 gap-y-5 md:grid-cols-9">
            {features.map((feature, index) => {
              const Icon = ICONS[feature.icon] ?? PlantIcon;
              const styles = COLOR_STYLES[feature.color] ?? COLOR_STYLES.violet;

              return (
                <div
                  className={cn(
                    "_item flex cursor-pointer flex-col items-center space-y-2 transition-all duration-300",
                    styles.text,
                    activeFeature === feature.id
                      ? "scale-110"
                      : "opacity-70 hover:scale-105 hover:opacity-100",
                  )}
                  key={index}
                  onClick={() => {
                    setActiveFeature(feature.id);
                    const targetIndex = features.findIndex(
                      (f) => f.id === feature.id,
                    );
                    if (targetIndex >= 0) {
                      carouselApi?.scrollTo?.(targetIndex);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setActiveFeature(feature.id);
                      const targetIndex = features.findIndex(
                        (f) => f.id === feature.id,
                      );
                      if (targetIndex >= 0) {
                        carouselApi?.scrollTo?.(targetIndex);
                      }
                    }
                  }}
                >
                  <div className="_icon flex size-14 items-center justify-center rounded-full bg-white">
                    <Icon className="size-7" weight="duotone" />
                  </div>
                  <div className="_title text-[13px] font-semibold text-white">
                    {feature.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Carousel
          className="w-full"
          opts={{
            direction: "rtl",
            loop: true,
            watchSlides: true,
          }}
          setApi={setCarouselApi}
        >
          <CarouselContent>
            {features.map((feature) => {
              const Icon = ICONS[feature.icon] ?? PlantIcon;
              const styles = COLOR_STYLES[feature.color] ?? COLOR_STYLES.violet;

              return (
                <CarouselItem
                  key={feature.id}
                  className="mx-auto max-w-[300px]"
                >
                  <div className="p-1">
                    <Card className="overflow-hidden border-none">
                      <CardContent
                        className={cn(
                          "flex flex-col items-center justify-center p-0 duration-300",
                          activeFeature === feature.id ? "" : "blur-xs",
                        )}
                      >
                        <div
                          className={cn(
                            "flex w-full justify-center rounded-t-xl rounded-br-3xl bg-gradient-to-t pb-5",
                            styles.bgFrom,
                            styles.bgTo,
                          )}
                        >
                          <Image
                            src={`/images/features/${feature.image}`}
                            alt={feature.title}
                            width={160}
                            height={240}
                          />
                        </div>
                        <div className={cn("px-5 pt-4 pb-6", styles.text)}>
                          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
                            <Icon className="size-7" weight="duotone" />
                            {feature.title}
                          </h2>
                          <p className="text-sm">{feature.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="mt-8 flex justify-center px-5">
        <Button asChild className="w-full md:w-auto" variant="outline">
          <Link href="https://console.befroosh.app">فعالسازی رایگان</Link>
        </Button>
      </div>
    </section>
  );
};
