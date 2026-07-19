'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/* ----------------------------- Types ----------------------------- */

type StableCarouselContextValue = {
  currentIndex: number;
  totalItems: number;
  isRtl: boolean;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const StableCarouselContext = React.createContext<StableCarouselContextValue | null>(null);

export function useStableCarousel() {
  const context = React.useContext(StableCarouselContext);
  if (!context) {
    throw new Error('useStableCarousel must be used within a <StableCarousel />');
  }
  return context;
}

/* ----------------------------- StableCarousel ----------------------------- */

export type StableCarouselApi = {
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  currentIndex: () => number;
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
};

type StableCarouselProps = {
  children: React.ReactNode;
  className?: string;
  setApi?: (api: StableCarouselApi) => void;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
};

export function StableCarousel({
  children,
  className,
  setApi,
  defaultIndex = 0,
  onIndexChange,
}: StableCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(defaultIndex);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isRtl, setIsRtl] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Count children to determine total items, and read the resolved text
  // direction so the track can translate toward the correct physical side —
  // in `dir="rtl"` ancestors (this app's default locale), a flex row's main
  // axis runs right-to-left, so a plain `-index * 100%` translate pushes
  // slides off-screen in the wrong direction instead of revealing them.
  React.useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('[data-stable-carousel-item="true"]');
      setTotalItems(items.length);
      setIsRtl(getComputedStyle(containerRef.current).direction === 'rtl');
    }
  });

  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < totalItems - 1;

  const scrollTo = React.useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));
      setCurrentIndex(clampedIndex);
      onIndexChange?.(clampedIndex);
    },
    [totalItems, onIndexChange],
  );

  const scrollPrev = React.useCallback(() => {
    if (canScrollPrev) {
      scrollTo(currentIndex - 1);
    }
  }, [canScrollPrev, currentIndex, scrollTo]);

  const scrollNext = React.useCallback(() => {
    if (canScrollNext) {
      scrollTo(currentIndex + 1);
    }
  }, [canScrollNext, currentIndex, scrollTo]);

  // Expose API
  React.useEffect(() => {
    if (setApi) {
      setApi({
        scrollTo,
        scrollPrev,
        scrollNext,
        currentIndex: () => currentIndex,
        canScrollPrev: () => canScrollPrev,
        canScrollNext: () => canScrollNext,
      });
    }
  }, [setApi, scrollTo, scrollPrev, scrollNext, currentIndex, canScrollPrev, canScrollNext]);

  // Clamp current index when items are removed
  React.useEffect(() => {
    if (totalItems > 0 && currentIndex >= totalItems) {
      scrollTo(totalItems - 1);
    }
  }, [totalItems, currentIndex, scrollTo]);

  const contextValue = React.useMemo(
    () => ({
      currentIndex,
      totalItems,
      isRtl,
      scrollTo,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    }),
    [
      currentIndex,
      totalItems,
      isRtl,
      scrollTo,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    ],
  );

  return (
    <StableCarouselContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="stable-carousel"
      >
        {children}
      </div>
    </StableCarouselContext.Provider>
  );
}

/* ----------------------------- StableCarouselContent ----------------------------- */

type StableCarouselContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function StableCarouselContent({ children, className }: StableCarouselContentProps) {
  const { currentIndex, isRtl } = useStableCarousel();
  const sign = isRtl ? 1 : -1;

  return (
    <div className="overflow-hidden" data-slot="stable-carousel-content">
      <div
        className={cn('flex transition-transform duration-300 ease-out', className)}
        style={{
          transform: `translateX(${sign * currentIndex * 100}%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- StableCarouselItem ----------------------------- */

type StableCarouselItemProps = {
  children: React.ReactNode;
  className?: string;
};

export function StableCarouselItem({ children, className }: StableCarouselItemProps) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-stable-carousel-item="true"
      data-slot="stable-carousel-item"
      className={cn('w-full shrink-0', className)}
    >
      {children}
    </div>
  );
}

/* ----------------------------- StableCarouselPrevious / Next ----------------------------- */

type StableCarouselButtonProps = Omit<React.ComponentProps<typeof Button>, 'onClick'>;

export function StableCarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: StableCarouselButtonProps) {
  const { scrollPrev, canScrollPrev, totalItems } = useStableCarousel();
  if (totalItems < 2) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'absolute start-2 top-1/2 -translate-y-1/2 rounded-full',
        size === 'icon' && 'size-8',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon className="size-4 rtl:rotate-180" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

export function StableCarouselNext({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: StableCarouselButtonProps) {
  const { scrollNext, canScrollNext, totalItems } = useStableCarousel();
  if (totalItems < 2) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'absolute end-2 top-1/2 -translate-y-1/2 rounded-full',
        size === 'icon' && 'size-8',
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon className="size-4 rtl:rotate-180" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export type { StableCarouselProps, StableCarouselContentProps, StableCarouselItemProps };
