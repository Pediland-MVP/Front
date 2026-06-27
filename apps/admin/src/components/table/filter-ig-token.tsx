// src/components/table/filter-ig-token.tsx
'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

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

const igTokenStatuses = [
  {
    value: 'true',
    label: 'متصل',
  },
  {
    value: 'false',
    label: 'قطع',
  },
];

type FilterIgTokenProps = {
  value?: string;
  onChange: (value: string) => void;
  size?: 'default' | 'sm';
};

export function FilterIgToken({ onChange, value = '', size = 'default' }: FilterIgTokenProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className="justify-between md:w-[120px]"
        >
          {value ? igTokenStatuses.find((s) => s.value === value)?.label : 'اتصال'}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>هیچ وضعیتی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {igTokenStatuses.map((s) => (
                <CommandItem
                  className="text-[13px]"
                  key={s.value}
                  value={s.value}
                  onSelect={(currentValue) => {
                    const nextValue = currentValue === value ? '' : currentValue;
                    onChange(nextValue);
                    setOpen(false);
                  }}
                >
                  {s.label}
                  <Check
                    className={cn('ml-auto', value === s.value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
