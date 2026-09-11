'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const locale = useLocale();

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 cursor-pointer rounded-full ring-0 transition-transform data-[state=unchecked]:translate-x-0',
          // Underscores, not spaces: Tailwind turns `_` into a space inside an arbitrary value.
          // Written as `calc(100%-2px)` the emitted declaration is invalid CSS — calc needs
          // whitespace around `-` — so the browser dropped it and the thumb never moved. The
          // switch still changed colour, which is why this went unnoticed.
          locale === 'fa'
            ? 'data-[state=checked]:-translate-x-[calc(100%_-_2px)]'
            : 'data-[state=checked]:translate-x-[calc(100%_-_2px)]',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
