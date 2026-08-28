'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PencilIcon, Trash2Icon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ICity } from '@/types/city';
import type { IProvince } from '@/types/province';
import type { CommerceShippingKind, CommerceShippingSettlement } from '@/types/shipping';
import {
  chargesShipping,
  type ShippingOptionDraft,
  type ShippingOverrideDraft,
} from '@/utils/commerce/shippingDraft';

import {
  editorCard,
  editorIconButton,
  editorIconButtonDanger,
  editorInput,
} from '../ProductEditor/ui/editorChrome';
import { formatAmount, formatCount } from '../ProductEditor/utils/editorNumber.util';
import { MoneyField } from './MoneyField';
import { RateOverrideEditor } from './RateOverrideEditor';

/** Order the kinds are offered in — the two postal services first, since most merchants use them. */
const KINDS: CommerceShippingKind[] = [
  'post_express',
  'post_registered',
  'tipax',
  'courier',
  'pickup',
  'other',
];

/** Ordered cheapest-commitment-first for the merchant: prepay, then the two collect-at-the-door
 *  modes. Exactly one applies — see `CommerceShippingSettlement`. */
const SETTLEMENTS: CommerceShippingSettlement[] = [
  'prepaid',
  'freight_collect',
  'cash_on_delivery',
];

interface ShippingMethodCardProps {
  draft: ShippingOptionDraft;
  onChange: (patch: Partial<ShippingOptionDraft>) => void;
  onRemove: () => void;
  canEdit: boolean;
  provinces: IProvince[];
  cities: ICity[];
  provinceById: Map<number, IProvince>;
  cityById: Map<number, ICity>;
}

/**
 * One shipping method: its switch, its price, and everything that modifies that price.
 *
 * `settlement` is a single three-way choice — prepay, پس‌کرایه, or پرداخت در محل — because a
 * method is exactly one of them and never two at once. It is a radio group rather than switches
 * for the same reason: switches would let a merchant turn on two mutually exclusive things and
 * then have the screen quietly pick one.
 *
 * Only the prepaid mode has a rate the seller charges, so the price, the free-shipping threshold
 * and the per-city exceptions are HIDDEN under the other two rather than left on screen
 * contradicting the mode. The server enforces the same exclusion with a CHECK constraint.
 */
export const ShippingMethodCard = ({
  draft,
  onChange,
  onRemove,
  canEdit,
  provinces,
  cities,
  provinceById,
  cityById,
}: ShippingMethodCardProps) => {
  const t = useTranslations('Commerce.Shipping');

  /**
   * An inactive method still needs editing — that is how you fix the price before switching it
   * back on. The design hides the body of an inactive card, which would make a deactivated method
   * uneditable, so a small "ویرایش" reveals it instead.
   */
  const [isForcedOpen, setIsForcedOpen] = useState(false);
  const isBodyOpen = draft.isActive || isForcedOpen;
  const charges = chargesShipping(draft);

  const summary = useMemo(() => {
    if (!draft.isActive) return t('summaryInactive');

    if (draft.settlement === 'freight_collect') return t('summaryFreightCollect');
    if (draft.settlement === 'cash_on_delivery') return t('summaryCashOnDelivery');

    const parts: string[] = [
      draft.amount > 0 ? `${formatAmount(draft.amount)} ${t('priceUnit')}` : t('summaryFree'),
    ];
    if (draft.freeOverAmount != null) {
      parts.push(t('summaryFreeAbove', { amount: formatAmount(draft.freeOverAmount) }));
    }
    if (draft.overrides.length > 0) {
      parts.push(t('summaryExceptions', { count: formatCount(draft.overrides.length) }));
    }
    return parts.join('  ·  ');
  }, [draft, t]);

  const setOverrides = (next: ShippingOverrideDraft[]) => onChange({ overrides: next });

  return (
    <div className={editorCard}>
      <div className="flex items-start gap-3 p-4">
        <div className="pt-0.5">
          <Switch
            checked={draft.isActive}
            disabled={!canEdit}
            onCheckedChange={(checked) => onChange({ isActive: checked })}
            aria-label={draft.title}
          />
        </div>

        <div className={cn('flex min-w-0 flex-1 flex-col gap-1', !draft.isActive && 'opacity-55')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold">{draft.title || t('newMethodTitle')}</span>
            <span className="bg-tint text-mut rounded px-1.5 py-0.5 text-[10px] font-bold">
              {t(`kinds.${draft.kind}`)}
            </span>
          </div>
          <div data-testid="method-summary" className="text-mut text-xs">
            {summary}
          </div>
        </div>

        <div className="flex flex-none items-center gap-1">
          {!draft.isActive && (
            <button
              type="button"
              onClick={() => setIsForcedOpen((open) => !open)}
              aria-label={t('editInactive')}
              aria-expanded={isForcedOpen}
              className={editorIconButton}
            >
              <PencilIcon className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            disabled={!canEdit}
            onClick={onRemove}
            aria-label={`${t('remove')} — ${draft.title}`}
            className={editorIconButtonDanger}
          >
            <Trash2Icon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {isBodyOpen && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div className="border-ln grid gap-3 border-t pt-3.5 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div>
              <label className="text-mut mb-1.5 block text-xs font-bold">{t('kindLabel')}</label>
              <Select
                value={draft.kind}
                disabled={!canEdit}
                onValueChange={(value) => onChange({ kind: value as CommerceShippingKind })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`kinds.${kind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor={`title-${draft.key}`}
                className="text-mut mb-1.5 block text-xs font-bold"
              >
                {t('titleLabel')}
              </label>
              <input
                id={`title-${draft.key}`}
                type="text"
                disabled={!canEdit}
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className={cn(editorInput, 'font-semibold')}
              />
            </div>
          </div>

          {/*
            A radio group, not switches: the three modes are mutually exclusive, and switches
            would let a merchant turn on two of them and leave the screen to quietly pick one.
          */}
          <fieldset className="border-lnv bg-tint rounded-xl border p-3">
            <legend className="text-mut px-1 text-xs font-bold">{t('settlementLabel')}</legend>
            <RadioGroup
              value={draft.settlement}
              disabled={!canEdit}
              onValueChange={(value) =>
                onChange({ settlement: value as CommerceShippingSettlement })
              }
              className="gap-2"
            >
              {SETTLEMENTS.map((mode) => (
                <label
                  key={mode}
                  htmlFor={`settlement-${draft.key}-${mode}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-colors',
                    draft.settlement === mode ? 'bg-card' : 'hover:bg-card/60',
                  )}
                >
                  <RadioGroupItem
                    id={`settlement-${draft.key}-${mode}`}
                    value={mode}
                    // The wrapping label also holds the explanation paragraph, so without this the
                    // accessible name would be the mode plus a sentence of prose.
                    aria-label={t(`settlements.${mode}`)}
                    className="mt-0.5"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{t(`settlements.${mode}`)}</span>
                    <span className="text-mut text-xs text-pretty">
                      {t(`settlementNotes.${mode}`)}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          {charges ? (
            <>
              <div className="flex flex-wrap items-end gap-3.5">
                <div className="w-48">
                  <label
                    htmlFor={`price-${draft.key}`}
                    className="text-mut mb-1.5 block text-xs font-bold"
                  >
                    {t('priceLabel')}
                  </label>
                  <MoneyField
                    id={`price-${draft.key}`}
                    value={draft.amount}
                    onChange={(next) => onChange({ amount: next ?? 0 })}
                    disabled={!canEdit}
                    ariaLabel={t('priceLabel')}
                    unit={t('priceUnit')}
                  />
                </div>
                <p className="text-mut max-w-72 pb-3 text-xs text-pretty">{t('priceHint')}</p>
              </div>

              <div className="border-lnv bg-tint flex flex-wrap items-center gap-2.5 rounded-xl border p-3">
                <Switch
                  // `null` means the seller never waives shipping; a number (0 included) means
                  // they do. The switch is that distinction, which is why turning it off writes
                  // null rather than 0 -- 0 would mean "always free".
                  checked={draft.freeOverAmount != null}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => onChange({ freeOverAmount: checked ? 0 : null })}
                  aria-label={t('freeOverLabel')}
                />
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <span className="text-sm font-semibold">{t('freeOverLabel')}</span>
                  {draft.freeOverAmount != null ? (
                    <MoneyField
                      value={draft.freeOverAmount}
                      onChange={(next) => onChange({ freeOverAmount: next ?? 0 })}
                      disabled={!canEdit}
                      size="sm"
                      // Distinct from the switch beside it: two controls in the same row must not
                      // share an accessible name, or a screen reader announces them identically.
                      ariaLabel={t('freeOverAmountLabel')}
                      unit={t('priceUnit')}
                      className="[&_input]:bg-card w-40 [&_input]:h-[34px] [&_input]:text-sm"
                    />
                  ) : (
                    <span className="text-mut text-sm">{t('freeOverDisabled')}</span>
                  )}
                </div>
              </div>

              <RateOverrideEditor
                overrides={draft.overrides}
                onChange={setOverrides}
                disabled={!canEdit}
                provinces={provinces}
                cities={cities}
                provinceById={provinceById}
                cityById={cityById}
              />
            </>
          ) : (
            <p className="text-mut text-xs text-pretty">{t('noRateNote')}</p>
          )}
        </div>
      )}
    </div>
  );
};
