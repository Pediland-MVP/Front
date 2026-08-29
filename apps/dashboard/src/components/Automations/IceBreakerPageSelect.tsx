'use client';

import { useState } from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { InstagramNamespace } from '@/types/instagram';

/**
 * Single-account picker for the Ice Breakers page.
 *
 * Visually the same control as the automation builder's `InstagramSelectField`
 * (same trigger, popover, avatar and violet selection colours) but single-select:
 * Meta stores ice breakers on one account's `messenger_profile`, so there is
 * nothing to multi-select here.
 *
 * Hidden entirely when the workspace has one page — there is nothing to choose.
 */
export function IceBreakerPageSelect({
  accounts,
  value,
  onChange,
  label,
}: {
  accounts: InstagramNamespace.Account[];
  value: string | null;
  onChange: (instagramId: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  if (accounts.length <= 1) return null;

  const selected = accounts.find((account) => account.id === value) ?? null;

  return (
    <div className="space-y-1.5">
      <span className="text-[13px] font-medium text-gray-700">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-10 w-full items-center gap-2.5 rounded-lg border bg-white px-3 text-sm shadow-sm transition-colors sm:max-w-xs',
              open
                ? 'border-violet-400 ring-2 ring-violet-100'
                : 'border-gray-200 hover:border-violet-300',
            )}
          >
            {selected ? (
              <>
                <AccountAvatar account={selected} size={24} />
                <span className="truncate font-medium">{selected.username ?? selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{label}</span>
            )}
            <ChevronDownIcon
              className={cn(
                'ms-auto size-4 shrink-0 text-gray-400 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-1.5" align="start" sideOffset={6}>
          <div className="space-y-0.5">
            {accounts.map((account) => {
              const isSelected = account.id === value;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onChange(account.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                    isSelected ? 'bg-violet-50 text-violet-800' : 'text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <AccountAvatar account={account} size={32} />
                  <div className="min-w-0 flex-1 text-start">
                    <div className="truncate leading-tight font-medium">{account.name}</div>
                    <div className="truncate text-xs text-gray-500">@{account.username ?? ''}</div>
                  </div>
                  <CheckIcon
                    className={cn(
                      'size-4 shrink-0 transition-opacity',
                      isSelected ? 'text-violet-600 opacity-100' : 'opacity-0',
                    )}
                  />
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AccountAvatar({ account, size }: { account: InstagramNamespace.Account; size: number }) {
  const [imgError, setImgError] = useState(false);

  if (account.profilePictureUrl && !imgError) {
    return (
      <img
        src={account.profilePictureUrl}
        alt={account.username ?? account.name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return <InstagramLogoIcon size={size} className="shrink-0 text-gray-400" />;
}
