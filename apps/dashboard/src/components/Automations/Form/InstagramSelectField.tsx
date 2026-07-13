'use client';

import { fetcher } from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import { toggleInstagramSelection } from '@/lib/instagramMultiSelect';
import { InstagramNamespace } from '@/types/instagram';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

import { IResponseMessage } from '@/types/responseMessage';

export function InstagramSelectField() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Automations');
  const { control } = useFormContext();

  // While a specific post is targeted, the automation is locked to the single
  // Instagram account that post belongs to — changing the selection here (even
  // swapping one account for another while staying at one selected) would leave
  // `instagramPost` pointing at a media item from an account that's no longer
  // selected, and no schema check catches that mismatch. Lock the picker instead
  // of trying to validate every possible mutation after the fact.
  const isPostTargetEnabled = useWatch({ control, name: 'isCommentContentTargetEnabled' });
  const disabled = !!isPostTargetEnabled;

  const { data: response, isLoading } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });

  const accounts = response?.data;

  if (isLoading || !accounts || accounts.length === 0) return null;

  return (
    <FormField
      control={control}
      name="instagramIds"
      render={({ field }) => {
        const selectedIds: string[] = Array.isArray(field.value) ? field.value : [];

        const toggle = (id: string) => {
          field.onChange(toggleInstagramSelection(selectedIds, id));
        };

        const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

        return (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">
              {t('select_instagrams')}
            </FormLabel>
            <FormControl>
              <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                      'flex min-h-10 w-full items-center gap-3 rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm transition-colors',
                      open
                        ? 'border-violet-400 ring-2 ring-violet-100'
                        : 'border-gray-200 hover:border-violet-300',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <SelectedAccounts accounts={selectedAccounts} t={t} />
                    {!disabled && (
                      <ChevronDownIcon
                        className={cn(
                          'ms-auto size-4 shrink-0 text-gray-400 transition-transform duration-200',
                          open && 'rotate-180',
                        )}
                      />
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-72 p-1.5" align="start" sideOffset={6}>
                  <div className="space-y-0.5">
                    {accounts.map((acc) => {
                      const isSelected = selectedIds.includes(acc.id);
                      const isOnlySelected = isSelected && selectedIds.length === 1;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          disabled={isOnlySelected}
                          onClick={() => toggle(acc.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
                            isSelected
                              ? 'bg-violet-50 text-violet-800'
                              : 'text-gray-700 hover:bg-gray-50',
                            isOnlySelected && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <AccountAvatar account={acc} size={32} />
                          <div className="min-w-0 flex-1 text-start">
                            <div className="truncate leading-tight font-medium">{acc.name}</div>
                            <div className="truncate text-xs text-gray-500">
                              @{acc.username ?? ''}
                            </div>
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
            </FormControl>
            {isPostTargetEnabled && (
              <p className="text-muted-foreground text-[13px]">
                {t('instagram_locked_for_post_target')}
              </p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function SelectedAccounts({
  accounts,
  t,
}: {
  accounts: InstagramNamespace.Account[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (accounts.length === 0) {
    return (
      <span className="text-muted-foreground text-[13px]">{t('select_account_placeholder')}</span>
    );
  }

  // A single selected account gets a plain, larger-avatar treatment (no pill
  // background needed when there's nothing to visually group); two or more get
  // wrapped pill chips so they read as a set. Same loop either way — the avatar
  // stays a flex sibling of the text so truncation only ever applies to the text.
  const isSingle = accounts.length === 1;

  return (
    <span
      className={cn('flex min-w-0 items-center gap-2', !isSingle && 'flex-1 flex-wrap gap-1.5')}
    >
      {accounts.map((account) => (
        <span
          key={account.id}
          className={cn(
            'flex min-w-0 items-center gap-1',
            isSingle && 'gap-2',
            !isSingle &&
              'rounded-full bg-violet-50 py-0.5 ps-0.5 pe-2 text-xs font-medium text-violet-700',
          )}
        >
          <AccountAvatar account={account} size={isSingle ? 24 : 18} />
          <span className={cn(isSingle && 'truncate font-medium text-gray-800')}>
            @{account.username ?? account.name}
          </span>
        </span>
      ))}
    </span>
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
