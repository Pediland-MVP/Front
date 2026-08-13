// src/components/table/filter-how-found-us.tsx
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

// UI Imports
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, FunnelIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HOW_FOUND_US_VALUES } from '@/constants/howFoundUs.constant';

type FilterHowFoundUsProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  size?: 'default' | 'sm';
};

/**
 * Multi-select for «چطور با بفروش آشنا شد؟» on the users table.
 *
 * Shaped after `filter-category.tsx`, but the options are a fixed enum rather than a
 * fetched list — there is no endpoint to hit and the values never change at runtime.
 */
export function FilterHowFoundUs({
  onChange,
  value = [],
  size = 'default',
}: FilterHowFoundUsProps) {
  const t = useTranslations('Users');
  const [open, setOpen] = React.useState(false);

  const toggleValue = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const selectedLabels = HOW_FOUND_US_VALUES.filter((o) => value.includes(o))
    .map((o) => t(`options.${o}`))
    .join('، ');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className="justify-between truncate md:w-[170px]"
        >
          {value.length > 0 ? selectedLabels : t('howFoundUs_filter')}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[170px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>{t('howFoundUs_empty')}</CommandEmpty>
            <CommandGroup>
              {HOW_FOUND_US_VALUES.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => toggleValue(option)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(option) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {t(`options.${option}`)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
