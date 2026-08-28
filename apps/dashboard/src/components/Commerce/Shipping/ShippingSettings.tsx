'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/Global/DeleteConfirmationDialog';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { usePermissions } from '@/hooks/usePermissions';
import { useShippingDestinations } from '@/hooks/useShippingDestinations';
import { useShippingOptions } from '@/hooks/useShippingOptions';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { CommerceShippingOption } from '@/types/shipping';
import {
  areOverridesDirty,
  isOptionDirty,
  newOptionDraft,
  toDraft,
  toOverridesPayload,
  toPayload,
  type ShippingOptionDraft,
} from '@/utils/commerce/shippingDraft';

import { editorAddButton } from '../ProductEditor/ui/editorChrome';
import { formatCount } from '../ProductEditor/utils/editorNumber.util';
import { ShippingMethodCard } from './ShippingMethodCard';

/** A signature of the server payload, used to tell a real refetch from an identical one. */
const signatureOf = (options: CommerceShippingOption[]) =>
  JSON.stringify(
    options.map((o) => [
      o.id,
      o.kind,
      o.title,
      o.pricing,
      o.amount,
      o.freeOverAmount,
      o.sortOrder,
      o.isActive,
      (o.overrides ?? []).map((v) => [v.id, v.cityId, v.provinceId, v.amount]),
    ]),
  );

/**
 * The whole "تنظیمات ارسال پستی" screen.
 *
 * Every card edits a local draft and nothing is sent until the header's save button. That is a
 * deliberate choice over save-per-field: the API is one route per option plus a second route for
 * that option's exceptions, so a merchant adjusting a price and two city exceptions would otherwise
 * fire three writes and see three toasts. Batching also makes "انصراف" a real undo.
 *
 * Deletion is the exception — it runs immediately, behind a confirmation. Burying a destructive
 * action inside a generic "save changes" is how people lose data they did not mean to.
 */
export const ShippingSettings = () => {
  const t = useTranslations('Commerce.Shipping');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  // Matches the backend controller: reads need ORDER_VIEW, every write needs ORDER_MANAGE.
  const canEdit = can('order:manage');

  const {
    options,
    isLoading,
    error,
    mutate,
    createOption,
    updateOption,
    deleteOption,
    setOverrides,
  } = useShippingOptions();
  const destinations = useShippingDestinations();

  const [drafts, setDrafts] = useState<ShippingOptionDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<ShippingOptionDraft | null>(null);

  const originalById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const isDirty = useMemo(() => {
    if (drafts.some((d) => d.serverId == null)) return true;
    return drafts.some((d) => {
      const original = d.serverId ? originalById.get(d.serverId) : undefined;
      if (!original) return true;
      return isOptionDirty(d, original) || areOverridesDirty(d, original);
    });
  }, [drafts, originalById]);

  /**
   * Adopt server data on first load and on any refetch that actually changed something — but never
   * on top of unsaved edits. SWR revalidates on reconnect and on a stale cache, and without this
   * guard a background refetch would wipe out whatever the merchant was in the middle of typing.
   */
  const lastSignature = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (isLoading) return;
    const signature = signatureOf(options);
    if (signature === lastSignature.current) return;
    if (lastSignature.current !== null && isDirtyRef.current) return;

    lastSignature.current = signature;
    setDrafts(options.map(toDraft));
  }, [options, isLoading]);

  const reset = () => {
    lastSignature.current = signatureOf(options);
    setDrafts(options.map(toDraft));
  };

  const patchDraft = (key: string, patch: Partial<ShippingOptionDraft>) =>
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const addDraft = () =>
    setDrafts((current) => [...current, newOptionDraft(t('newMethodTitle'), current.length)]);

  const toastError = (fallback: string, cause: unknown) => {
    const code = isAxiosError(cause)
      ? (cause.response?.data as ExceptionMessage | undefined)?.code
      : undefined;
    toast.error(code ? t_ec(code) : fallback);
  };

  const confirmRemoval = async () => {
    const target = pendingRemoval;
    setPendingRemoval(null);
    if (!target) return;

    // A card that was never saved exists only on screen — drop it without touching the server.
    if (!target.serverId) {
      setDrafts((current) => current.filter((d) => d.key !== target.key));
      return;
    }

    try {
      await deleteOption(target.serverId);
      setDrafts((current) => current.filter((d) => d.key !== target.key));
      lastSignature.current = null;
      await mutate();
    } catch (cause) {
      toastError(t('saveFailed'), cause);
    }
  };

  /**
   * Writes run one option at a time, and stop at the first failure.
   *
   * Sequential rather than parallel because a partial failure has to leave a comprehensible state:
   * with `Promise.all` a merchant would get one error and no idea which of four methods actually
   * saved. Stopping early keeps every unsaved change in the drafts, so pressing save again retries
   * exactly what is left.
   */
  const save = async () => {
    if (!canEdit || isSaving) return;

    const blank = drafts.find((d) => d.title.trim() === '');
    if (blank) {
      toast.error(t('titleRequired'));
      return;
    }
    const missingThreshold = drafts.find(
      (d) => !d.postKerayeh && d.freeOverEnabled && d.freeOverAmount <= 0,
    );
    if (missingThreshold) {
      toast.error(t('freeOverRequired'));
      return;
    }

    setIsSaving(true);
    try {
      for (const draft of drafts) {
        if (!draft.serverId) {
          const response = await createOption(toPayload(draft));
          const created = response.data?.data as CommerceShippingOption | undefined;
          const overrides = toOverridesPayload(draft);
          if (created?.id && overrides.overrides.length > 0) {
            await setOverrides(created.id, overrides);
          }
          continue;
        }

        const original = originalById.get(draft.serverId);
        if (original && isOptionDirty(draft, original)) {
          await updateOption(draft.serverId, toPayload(draft));
        }
        if (!original || areOverridesDirty(draft, original)) {
          await setOverrides(draft.serverId, toOverridesPayload(draft));
        }
      }

      toast.success(t('saved'));
      lastSignature.current = null;
      await mutate();
    } catch (cause) {
      toastError(t('saveFailed'), cause);
    } finally {
      setIsSaving(false);
    }
  };

  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);

  const headerButtons = useMemo(
    () =>
      canEdit ? (
        <>
          <Button type="button" variant="outline" disabled={!isDirty || isSaving} onClick={reset}>
            {t('cancel')}
          </Button>
          <Button type="button" disabled={!isDirty || isSaving} onClick={save}>
            {t('save')}
          </Button>
        </>
      ) : null,
    // `reset`/`save` close over the current drafts, so the buttons must be rebuilt when they move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, isDirty, isSaving, drafts, options, t],
  );

  useEffect(() => {
    setButtons(headerButtons);
  }, [headerButtons, setButtons]);

  useEffect(() => () => clearButtons(), [clearButtons]);

  if (isLoading || destinations.isLoading) return <LoaderSpin />;
  if (error) return <p className="text-wtext text-sm">{t('loadFailed')}</p>;

  const activeCount = drafts.filter((d) => d.isActive).length;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-1">
        <p className="text-mut max-w-xl text-sm text-pretty">{t('description')}</p>
        <span className="text-mut text-xs whitespace-nowrap">
          {t('activeSummary', {
            active: formatCount(activeCount),
            total: formatCount(drafts.length),
          })}
        </span>
      </div>

      {drafts.length === 0 && (
        <p className="border-ln text-mut rounded-xl border border-dashed px-4 py-6 text-center text-sm text-pretty">
          {t('empty')}
        </p>
      )}

      {drafts.map((draft) => (
        <ShippingMethodCard
          key={draft.key}
          draft={draft}
          canEdit={canEdit}
          onChange={(patch) => patchDraft(draft.key, patch)}
          onRemove={() => setPendingRemoval(draft)}
          provinces={destinations.provinces}
          cities={destinations.cities}
          provinceById={destinations.provinceById}
          cityById={destinations.cityById}
        />
      ))}

      {canEdit && (
        <button type="button" onClick={addDraft} className={editorAddButton}>
          <PlusIcon className="size-4" aria-hidden="true" />
          {t('addMethod')}
        </button>
      )}

      <DeleteConfirmationDialog
        isOpen={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />
    </div>
  );
};
