// packages/ui/src/automation-builder/Contents/AutomationSearchSelect.tsx
//
// NOTE: this is a deliberate, self-contained fork of
// apps/dashboard/src/components/Products/AutomationSearchSelect.tsx, not a move+shim of
// it. The dashboard original is also consumed by
// apps/dashboard/src/components/Products/SortableButtonItem.tsx (out of scope for this
// task) via the app's ambient `useSWR` + global SWRConfig fetcher (which itself wraps the
// dashboard-only, auth-interceptor-bearing axios client at `@/hooks/swr/api-client`) — a
// dependency packages/ui cannot take without breaking self-containment. Rather than
// changing that shared dashboard component's public API (which would silently break
// SortableButtonItem.tsx), this fork takes an injected `apiClient` (the same
// `AutomationBuilderApiClient` used by MediaContent) and calls `apiClient.get(...)`
// directly instead of relying on ambient SWR config.
'use client';

import { useDebounce } from '../../hooks/useDebounce';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AutomationBuilderApiClient } from '../types/apiClient';

interface ContentCycleCondition {
  id: string;
  value: string;
}

interface DestinationContentCycle {
  id: string;
  conditions: ContentCycleCondition[];
}

interface AutomationSearchSelectProps {
  value?: string;
  onSelect: (value: string, label: string) => void; // ← label اضافه شد
  error?: boolean;
  initialData?: DestinationContentCycle;
  title?: string; // ← فیلد جدید
  apiClient: AutomationBuilderApiClient;
}
interface ConditionItem {
  value: string;
  contentCycleId: string;
}

interface ConditionsResponse {
  items: ConditionItem[];
}

export function AutomationSearchSelect({
  value,
  onSelect,
  error,
  initialData,
  title,
  apiClient,
}: AutomationSearchSelectProps) {
  const t = useTranslations('Products.Form.Vitrin');
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);

  const displayLabel = React.useMemo(() => {
    if (title) return title;
    if (value && initialData?.id === value) {
      return initialData.conditions.map((c) => c.value).join(', ');
    }
    return value || '';
  }, [title, value, initialData]);

  // Store the selected item info (label) for display
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string;
    label: string;
  } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Fetch conditions when dropdown is open
  const { data, isLoading } = useSWR<ConditionsResponse>(
    open
      ? `/contentCycle/conditions?page=1&limit=30${debouncedSearch ? `&search=${debouncedSearch}` : ''}`
      : null,
    (url: string) => apiClient.get(url).then((res) => res.data),
  );

  const showLoading = isLoading || search !== debouncedSearch;

  // Group items by contentCycleId
  const groupedItems = React.useMemo(() => {
    if (!data?.items) return [];

    const groups = new Map<string, { id: string; values: string[] }>();

    data.items.forEach((item) => {
      // Use contentCycleId for grouping
      const id = item.contentCycleId;
      const existing = groups.get(id);
      if (existing) {
        existing.values.push(item.value);
      } else {
        groups.set(id, {
          id: id,
          values: [item.value],
        });
      }
    });

    return Array.from(groups.values()).map((group) => ({
      destinationContentCycleId: group.id,
      value: group.values.join(', '),
    }));
  }, [data?.items]);

  // Synchronization Effect: Keeps selectedItem in sync with value/data
  React.useEffect(() => {
    // 1. If value is empty, clear selection
    if (!value) {
      setSelectedItem(null);
      return;
    }

    // 2. If we already have the correct item, do nothing
    if (selectedItem?.id === value) {
      return;
    }

    // 3. Try finding in Initial Data (Edit Mode)
    if (initialData?.id === value) {
      setSelectedItem({
        id: value,
        label: initialData.conditions.map((c) => c.value).join(', '),
      });
      return;
    }

    // 4. Try finding in grouped API Data
    if (groupedItems.length > 0) {
      const found = groupedItems.find((item) => item.destinationContentCycleId === value);
      if (found) {
        setSelectedItem({ id: value, label: found.value });
        return;
      }
    }
  }, [value, initialData, groupedItems, selectedItem?.id]);

  const handleSelect = (id: string, label: string) => {
    onSelect(id, label); // ← label رو هم پاس بده
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between border bg-white font-normal hover:bg-white',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
          )}
        >
          {selectedItem && selectedItem.id === value
            ? selectedItem.label
            : displayLabel || t('search_automation')}
          <ChevronsUpDown className="-ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} />
          <CommandList>
            {showLoading && (
              <div className="text-muted-foreground py-3 text-center text-[13px]">
                {t('loading')}
              </div>
            )}
            {!showLoading && groupedItems.length === 0 && (
              <CommandEmpty>{t('no_results_found')}</CommandEmpty>
            )}
            <CommandGroup>
              {!showLoading &&
                groupedItems.map((item, index) => (
                  <CommandItem
                    key={`${item.destinationContentCycleId}-${index}`}
                    value={item.value}
                    className="justify-between text-[13px]"
                    onSelect={() => handleSelect(item.destinationContentCycleId, item.value)}
                  >
                    {item.value}
                    <Check
                      className={cn(
                        'size-4',
                        value === item.destinationContentCycleId ? 'opacity-100' : 'opacity-0',
                      )}
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
