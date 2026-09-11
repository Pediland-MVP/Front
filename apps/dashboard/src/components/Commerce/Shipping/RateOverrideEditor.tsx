'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, Trash2Icon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';
import { MAX_RATE_OVERRIDES } from '@/types/shipping';
import {
  destinationKey,
  searchDestinations,
  type ShippingDestination,
} from '@/utils/commerce/shippingDestinations';
import type { ShippingOverrideDraft } from '@/utils/commerce/shippingDraft';

import {
  editorAddButtonSm,
  editorIconButtonDanger,
  editorInputSm,
} from '../ProductEditor/ui/editorChrome';
import { formatCount } from '../ProductEditor/utils/editorNumber.util';
import { MoneyField } from './MoneyField';

/** How many exception rows are shown before "show more". */
const PAGE_SIZE = 12;

/** Above this many rows the list gets its own filter box; below it, scanning is faster. */
const FILTER_THRESHOLD = PAGE_SIZE;

let rowCounter = 0;
const nextRowKey = () => {
  rowCounter += 1;
  return `new-${rowCounter}`;
};

interface RateOverrideEditorProps {
  overrides: ShippingOverrideDraft[];
  onChange: (next: ShippingOverrideDraft[]) => void;
  disabled?: boolean;
  provinces: IProvince[];
  cities: ICity[];
  provinceById: Map<number, IProvince>;
  cityById: Map<number, ICity>;
}

/**
 * The per-destination price exceptions for one shipping option.
 *
 * Collapsed and empty by default, and that is the whole point of the sparse model: there are 1,119
 * cities, and a merchant who charges one price everywhere should never see a 1,119-row table. Each
 * row here replaces the option's default price for exactly one city or one whole province.
 *
 * The editor keeps everything in the parent's draft and saves nothing itself — `PUT :id/overrides`
 * is a full replace, fired once by the screen's save button with the whole list.
 */
export const RateOverrideEditor = ({
  overrides,
  onChange,
  disabled,
  provinces,
  cities,
  provinceById,
  cityById,
}: RateOverrideEditorProps) => {
  const t = useTranslations('Commerce.Shipping');

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  /**
   * Every destination picked in the CURRENT batch, not yet committed to `overrides`. Plural on
   * purpose: a merchant pricing several border cities the same wants to pick all of them, enter
   * ONE price once, and add them together -- searching again after a pick must never discard the
   * ones already chosen (that was the bug: the old single `pending` slot was wiped by the very
   * next keystroke in the search box).
   */
  const [pendingList, setPendingList] = useState<ShippingDestination[]>([]);
  const [newAmount, setNewAmount] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  /** Every destination that already has a row, OR is already picked in this batch -- either way
   * the search must never offer it again. */
  const taken = useMemo(() => {
    const keys = new Set(overrides.map((o) => destinationKey(o)));
    pendingList.forEach((d) => keys.add(destinationKey(d)));
    return keys;
  }, [overrides, pendingList]);

  const results = useMemo(
    () => searchDestinations({ provinces, cities, query, taken }),
    [provinces, cities, query, taken],
  );

  /** Resolve a row's stored id back into the names to show. */
  const describe = (row: ShippingOverrideDraft) => {
    if (row.kind === 'province') {
      return {
        name: provinceById.get(row.id)?.name ?? t('unknownDestination'),
        sub: t('allCities'),
        tag: t('tagProvince'),
      };
    }

    const city = cityById.get(row.id);
    return {
      name: city?.name ?? t('unknownDestination'),
      sub: (city && provinceById.get(city.provinceId)?.name) ?? '',
      tag: t('tagCity'),
    };
  };

  const described = useMemo(
    () => overrides.map((row) => ({ row, ...describe(row) })),
    // `describe` closes over the lookup maps and `t`; those are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, provinceById, cityById, t],
  );

  const filtered = useMemo(() => {
    const needle = filter.trim();
    if (!needle) return described;
    return described.filter((d) => d.name.includes(needle) || d.sub.includes(needle));
  }, [described, filter]);

  const visible = filtered.slice(0, limit);
  const isFull = overrides.length >= MAX_RATE_OVERRIDES;
  /** How many more rows this option can still hold -- caps a batch add, not just a single one. */
  const remainingCapacity = Math.max(0, MAX_RATE_OVERRIDES - overrides.length);
  const overCapacity = pendingList.length > remainingCapacity;
  const canAdd = !disabled && pendingList.length > 0 && newAmount != null && !overCapacity;

  const resetDraft = () => {
    setPendingList([]);
    setQuery('');
    setNewAmount(null);
  };

  /** A suggestion was clicked: add it to the batch and clear the box so the next search starts
   * fresh -- the previously picked destinations stay put. */
  const pickDestination = (destination: ShippingDestination) => {
    setPendingList((current) => [...current, destination]);
    setQuery('');
  };

  const unpickDestination = (key: string) =>
    setPendingList((current) => current.filter((d) => destinationKey(d) !== key));

  /** Commits every picked destination as its own row, all sharing the one price entered. */
  const addRows = () => {
    if (!canAdd) return;
    const newRows: ShippingOverrideDraft[] = pendingList.map((d) => ({
      key: nextRowKey(),
      kind: d.kind,
      id: d.id,
      amount: newAmount ?? 0,
    }));
    onChange([...newRows, ...overrides]);
    resetDraft();
  };

  const updateRow = (key: string, amount: number | null) =>
    onChange(overrides.map((o) => (o.key === key ? { ...o, amount: amount ?? 0 } : o)));

  const removeRow = (key: string) => onChange(overrides.filter((o) => o.key !== key));

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'text-mut -ms-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold',
          'hover:bg-tint2 hover:text-primary transition-colors',
        )}
      >
        <ChevronDownIcon
          className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
        <span>{overrides.length ? t('exceptionsOpen') : t('exceptionsAdd')}</span>
        {overrides.length > 0 && (
          <span className="bg-tint2 text-primary rounded-full px-2 py-px text-[11px] font-bold">
            {formatCount(overrides.length)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-lnv bg-tint mt-1.5 rounded-xl border p-3">
          <div className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_168px_auto]">
            <div className="relative min-w-0">
              <input
                type="text"
                disabled={disabled}
                aria-label={t('exceptionsSearchAria')}
                placeholder={t('exceptionsSearch')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(editorInputSm, 'bg-card h-[38px] text-sm')}
              />

              {results.length > 0 && (
                <div
                  className={cn(
                    'border-lnv bg-card absolute inset-x-0 top-11 z-20 max-h-60 overflow-auto',
                    'rounded-xl border p-1 shadow-lg',
                  )}
                >
                  {results.map((result) => (
                    <button
                      key={destinationKey(result)}
                      type="button"
                      onClick={() => pickDestination(result)}
                      className={cn(
                        'hover:bg-tint2 flex w-full items-center justify-between gap-2.5',
                        'rounded-lg px-2.5 py-2 text-start transition-colors',
                      )}
                    >
                      <span className="text-sm font-semibold">{result.name}</span>
                      <span className="text-mut text-[11px]">
                        {result.kind === 'province'
                          ? t('wholeProvince')
                          : (provinceById.get(cityById.get(result.id)?.provinceId ?? -1)?.name ??
                            '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() !== '' && results.length === 0 && (
                <div
                  className={cn(
                    'border-lnv bg-card text-mut absolute inset-x-0 top-11 z-20 rounded-xl',
                    'border px-2.5 py-3 text-sm shadow-lg',
                  )}
                >
                  {t('exceptionsNoResults')}
                </div>
              )}
            </div>

            <MoneyField
              value={newAmount}
              onChange={setNewAmount}
              disabled={disabled}
              size="sm"
              ariaLabel={t('exceptionsPriceAria')}
              placeholder={t('exceptionsPricePlaceholder')}
              unit={t('priceUnit')}
              className="[&_input]:bg-card [&_input]:h-[38px] [&_input]:text-sm"
            />

            <button
              type="button"
              disabled={!canAdd}
              onClick={addRows}
              className={cn(editorAddButtonSm, 'h-[38px]')}
            >
              {t('exceptionsAddButton')}
            </button>
          </div>

          {pendingList.length > 0 && (
            <div className="text-mut mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span>{t('exceptionsSelected')}</span>
              {pendingList.map((destination) => (
                <span
                  key={destinationKey(destination)}
                  className="border-lnv bg-card inline-flex items-center gap-1 rounded-full border py-1 ps-2.5 pe-1 text-xs font-semibold"
                >
                  {destination.kind === 'province'
                    ? `${t('tagProvince')} ${destination.name}`
                    : destination.name}
                  <button
                    type="button"
                    onClick={() => unpickDestination(destinationKey(destination))}
                    aria-label={`${t('exceptionsClearSelected')} — ${destination.name}`}
                    className="hover:bg-tint2 grid size-4 place-items-center rounded-full"
                  >
                    <XIcon className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {(isFull || overCapacity) && (
            <p className="text-wtext mt-2 text-xs">
              {t('exceptionsLimit', { max: formatCount(MAX_RATE_OVERRIDES) })}
            </p>
          )}

          {overrides.length === 0 ? (
            <p className="text-mut mt-2.5 text-xs text-pretty">{t('exceptionsEmptyHint')}</p>
          ) : (
            <div className="mt-3">
              {overrides.length > FILTER_THRESHOLD && (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2.5 px-0.5">
                  <input
                    type="text"
                    aria-label={t('exceptionsFilterAria')}
                    placeholder={t('exceptionsFilter')}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={cn(editorInputSm, 'bg-card w-48')}
                  />
                  <span className="text-mut text-xs">
                    {t('exceptionsFilterNote', {
                      shown: formatCount(filtered.length),
                      total: formatCount(overrides.length),
                    })}
                  </span>
                </div>
              )}

              <div className="text-mut grid grid-cols-[minmax(0,1fr)_120px_30px] gap-2.5 px-3 pb-1.5 text-[11px] font-bold sm:grid-cols-[minmax(0,1fr)_150px_30px]">
                <span>{t('exceptionsColumnTarget')}</span>
                <span>{t('exceptionsColumnPrice')}</span>
                <span />
              </div>

              <div className="flex flex-col gap-0.5">
                {visible.map(({ row, name, sub, tag }) => (
                  <div
                    key={row.key}
                    className={cn(
                      'hover:bg-card grid grid-cols-[minmax(0,1fr)_120px_30px] items-center gap-2.5',
                      'rounded-lg px-3 py-1.5 transition-colors sm:grid-cols-[minmax(0,1fr)_150px_30px]',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'flex-none rounded px-1.5 py-0.5 text-[10px] font-bold',
                          row.kind === 'province' ? 'bg-tint2 text-primary' : 'bg-tint text-mut',
                        )}
                      >
                        {tag}
                      </span>
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="text-mut truncate text-[11px]">{sub}</span>
                    </div>

                    <MoneyField
                      value={row.amount}
                      onChange={(next) => updateRow(row.key, next)}
                      disabled={disabled}
                      size="sm"
                      ariaLabel={`${t('priceLabel')} — ${name}`}
                      unit={t('priceUnit')}
                      className="[&_input]:bg-card"
                    />

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeRow(row.key)}
                      aria-label={`${t('exceptionsDelete')} — ${name}`}
                      className={editorIconButtonDanger}
                    >
                      <Trash2Icon className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 px-1 pt-2">
                {filtered.length > visible.length ? (
                  <button
                    type="button"
                    onClick={() => setLimit((current) => current + PAGE_SIZE)}
                    className="text-primary hover:bg-tint2 rounded-lg px-2 py-1 text-sm font-bold transition-colors"
                  >
                    {t('exceptionsMore', {
                      count: formatCount(Math.min(PAGE_SIZE, filtered.length - visible.length)),
                    })}
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange([])}
                  className="text-mut hover:text-dtext rounded-lg px-2 py-1 text-xs transition-colors"
                >
                  {t('exceptionsClearAll')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
