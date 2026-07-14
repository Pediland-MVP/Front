'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import {
  StableCarousel,
  StableCarouselApi,
  StableCarouselContent,
  StableCarouselItem,
  useStableCarousel,
} from '@/components/ui/stable-carousel';
import { useActiveBanners, ActiveBanner } from '@/hooks/useActiveBanners';

const AUTOPLAY_INTERVAL_MS = 5000;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function BannerCarouselDots() {
  const { currentIndex, totalItems, scrollTo } = useStableCarousel();
  if (totalItems < 2) return null;

  return (
    <div className="mt-2 flex justify-center gap-1.5">
      {Array.from({ length: totalItems }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`slide-${index + 1}`}
          onClick={() => scrollTo(index)}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            index === currentIndex ? 'bg-foreground' : 'bg-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

function BannerSlide({ banner, locale }: { banner: ActiveBanner; locale: string }) {
  const title = locale === 'fa' ? banner.titleFa : banner.titleEn;
  const description = locale === 'fa' ? banner.descriptionFa : banner.descriptionEn;

  return (
    <CardSimple className="my-2 bg-linear-to-bl" style={{ borderColor: banner.color }}>
      <CardContent className="flex flex-col gap-3 p-3.5 md:gap-4 md:p-6">
        <p className="text-sm font-bold md:text-lg" style={{ color: banner.color }}>
          {title}
        </p>
        <p
          className="text-xs leading-relaxed font-medium md:text-base"
          style={{ color: banner.color }}
        >
          {description}
        </p>
        {banner.buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {banner.buttons.map((button) => {
              const label = locale === 'fa' ? button.textFa : button.textEn;
              const className = 'rounded-md border px-3 py-1.5 text-xs font-semibold md:text-sm';
              return button.isExternal ? (
                <a
                  key={button.id}
                  href={button.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className={className}
                  style={{ borderColor: banner.color, color: banner.color }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={button.id}
                  href={button.url}
                  className={className}
                  style={{ borderColor: banner.color, color: banner.color }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </CardSimple>
  );
}

export const DashboardBannerCarousel = () => {
  const locale = useLocale();
  const { banners, isLoading } = useActiveBanners();
  const shuffled = useMemo(() => shuffle(banners), [banners]);

  const apiRef = useRef<StableCarouselApi | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering || shuffled.length < 2) return;
    const interval = setInterval(() => {
      const api = apiRef.current;
      if (!api) return;
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isHovering, shuffled.length]);

  if (isLoading || shuffled.length === 0) return null;

  return (
    <div
      className="mb-5"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => setIsHovering(true)}
      onTouchEnd={() => setIsHovering(false)}
    >
      <StableCarousel setApi={(api) => (apiRef.current = api)}>
        <StableCarouselContent>
          {shuffled.map((banner) => (
            <StableCarouselItem key={banner.id}>
              <BannerSlide banner={banner} locale={locale} />
            </StableCarouselItem>
          ))}
        </StableCarouselContent>
        <BannerCarouselDots />
      </StableCarousel>
    </div>
  );
};
