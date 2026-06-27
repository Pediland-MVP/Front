// src/app/(main)/tasks/tasks-bulk-assign.tsx
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

// Types
import type { User } from '@/types/user';

// UI
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, CheckIcon, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Utilities
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';

export function TasksBulkAssign({
  kams,
  actionIds,
  mutateData,
  onClearSelection,
}: {
  kams: User[];
  actionIds: string[];
  mutateData?: () => void;
  onClearSelection?: () => void;
}) {
  const tb = useTranslations('Tasks.bulk');
  const tt = useTranslations('Tasks.toasts');
  const t_ec = useTranslations('ERROR_CODES');

  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState('');

  const selectedKam = kams.find((kam) => kam.id === internalValue);

  const handleSelect = (id: string) => {
    setInternalValue(id);
    setOpen(false);
  };

  const handleAssign = async () => {
    if (!internalValue) return;

    try {
      await api.post('/actions/assignAdmin', {
        adminId: internalValue,
        actionIds,
      });

      mutateData?.();
      onClearSelection?.();
      toast.success(tt('reassigned'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { code?: string } } };
      toast.error(t_ec(err?.response?.data?.code as string) || tt('reassignError'));
    }
  };

  return (
    <div className="order-1 col-span-2 flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button role="combobox" className="flex-1 justify-between md:w-[140px]">
            {selectedKam ? `${selectedKam.firstname} ${selectedKam.lastname}` : tb('select')}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 md:w-[140px]">
          <Command>
            <CommandList>
              <CommandEmpty>{tb('empty')}</CommandEmpty>
              <CommandGroup>
                {kams.map((kam) => {
                  const fullName = `${kam.firstname} ${kam.lastname}`;
                  return (
                    <CommandItem key={kam.id} value={kam.id} onSelect={() => handleSelect(kam.id)}>
                      {fullName}
                      <Check
                        className={cn(
                          'mr-auto',
                          internalValue === kam.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button icon disabled={!internalValue} onClick={handleAssign}>
        <CheckIcon />
      </Button>
    </div>
  );
}
