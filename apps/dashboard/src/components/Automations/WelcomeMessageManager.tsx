'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import { toast } from 'sonner';
import { CirclePlusIcon, Trash2Icon } from 'lucide-react';
import { HandWavingIcon } from '@phosphor-icons/react/dist/ssr/HandWaving';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { AutomationSearchSelect } from '@/components/Products/AutomationSearchSelect';
import { ConnectInstagramAlert } from '@/components/Automations/ConnectInstagramAlert';
import { IceBreakerPageSelect } from '@/components/Automations/IceBreakerPageSelect';
import { usePermissions } from '@/hooks/usePermissions';
import { useIceBreakers } from '@/hooks/useIceBreakers';
import { fetcher } from '@/hooks/swr/api-client';
import { InstagramNamespace } from '@/types/instagram';
import { IResponseMessage } from '@/types/responseMessage';
import {
  ICE_BREAKER_MAX,
  ICE_BREAKER_QUESTION_MAX_LENGTH,
  IceBreakerCondition,
} from '@/types/iceBreaker';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/**
 * One editable slot. `contentCycleId` is empty until an automation is picked.
 * `conditions` is only the label source for an already-saved binding, so the
 * picker can show the automation's keywords before its own list has loaded.
 */
type DraftSlot = {
  key: string;
  question: string;
  contentCycleId: string;
  conditions: IceBreakerCondition[];
};

let slotKeySeq = 0;
const emptySlot = (): DraftSlot => ({
  key: `slot-${(slotKeySeq += 1)}`,
  question: '',
  contentCycleId: '',
  conditions: [],
});

/**
 * Ice Breakers editor — پیام خوش‌آمدگویی.
 *
 * Scoped to ONE Instagram page: Meta stores ice breakers on the account's own
 * `messenger_profile` node, four per account.
 *
 * The whole list saves at once. Meta replaces the entire field on every push, so
 * a per-slot save would invent a merge that could drift from what Instagram shows.
 *
 * Persian-only by design: the API stores text per locale, but `default` is Meta's
 * fallback bucket and is shown to everyone, so the UI writes only that.
 */
export const WelcomeMessageManager = () => {
  const t = useTranslations('WelcomeMessage');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();

  const canView = can('instagram:view');
  const canEdit = can('automation:edit');

  const { data: pagesResponse, isLoading: isPagesLoading } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(canView ? `${API_URL}/instagram/accounts` : null, fetcher, { revalidateOnMount: true });

  // Memoised: `?? []` would hand the effect below a new array every render.
  const pages = useMemo(() => pagesResponse?.data ?? [], [pagesResponse]);
  const [instagramId, setInstagramId] = useState<string | null>(null);

  useEffect(() => {
    if (!instagramId && pages.length) setInstagramId(pages[0].id);
  }, [pages, instagramId]);

  const { iceBreakers, isListLoaded, syncError, isLoading, error, save } =
    useIceBreakers(instagramId);

  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  /**
   * Seed the draft from the server list ONCE per page.
   *
   * Deliberately not "whenever `iceBreakers` changes": SWR revalidates on window
   * focus and after every save, and re-seeding on those would throw away whatever
   * the user had half-typed.
   */
  const seededForPageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!instagramId || !isListLoaded) return;
    if (seededForPageRef.current === instagramId) return;

    seededForPageRef.current = instagramId;
    setShowErrors(false);
    setSlots(
      iceBreakers.map((iceBreaker) => ({
        key: `slot-${(slotKeySeq += 1)}`,
        question: iceBreaker.questions?.default ?? '',
        contentCycleId: iceBreaker.contentCycleId,
        conditions: iceBreaker.contentCycle?.conditions ?? [],
      })),
    );
  }, [instagramId, isListLoaded, iceBreakers]);

  /**
   * A failed push to Instagram is reported as a toast, never an in-page banner.
   *
   * The push now runs inside the save request, so a save reports its own outcome
   * directly. This effect only covers the OTHER way a failure appears: the state
   * left behind by a knock-on re-push (an automation deleted, the account
   * reconnected), which the user sees when they next open the page.
   *
   * Two guards. The ref keyed on `instagramId:syncError` stops every SWR
   * revalidation re-announcing the same failure, and clears once a sync succeeds
   * so a later recurrence is announced again. `suppressSyncToastRef` covers the
   * save round-trip, where `handleSave` has already toasted the real outcome and
   * the refetched `syncError` would otherwise say the same thing twice.
   */
  const toastedSyncErrorRef = useRef<string | null>(null);
  const suppressSyncToastRef = useRef(false);

  useEffect(() => {
    if (!instagramId) return;

    if (!syncError) {
      toastedSyncErrorRef.current = null;
      return;
    }

    const marker = `${instagramId}:${syncError}`;
    if (toastedSyncErrorRef.current === marker) return;

    toastedSyncErrorRef.current = marker;

    if (suppressSyncToastRef.current) {
      suppressSyncToastRef.current = false;
      return;
    }

    toast.error(t('syncFailed', { error: syncError }));
  }, [instagramId, syncError, t]);

  const updateSlot = (key: string, patch: Partial<DraftSlot>) =>
    setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));

  const slotError = (slot: DraftSlot): string | null => {
    if (!slot.question.trim()) return t('requiredQuestion');
    if (!slot.contentCycleId) return t('requiredAutomation');
    return null;
  };

  const hasErrors = slots.some((slot) => slotError(slot) !== null);

  const handleSave = async () => {
    if (!instagramId) return;
    if (hasErrors) {
      setShowErrors(true);
      return;
    }

    setIsSaving(true);
    // handleSave reports the outcome itself; keep the effect above quiet for the
    // `syncError` this round-trip is about to write.
    suppressSyncToastRef.current = true;
    try {
      await save({
        instagramId,
        // Array order IS the display order — the backend derives sortOrder from it.
        items: slots.map((slot) => ({
          contentCycleId: slot.contentCycleId,
          questions: { default: slot.question.trim() },
        })),
      });
      setShowErrors(false);
      // The push to Instagram happened inside that request, so this really is done.
      toast.success(t('saved'));
    } catch (err: any) {
      const data = err?.response?.data;
      // Prefer the translated code; fall back to what the server actually said
      // (e.g. Meta's own message) rather than a generic failure. `t_ec` is only
      // called with a real code — next-intl renders the raw key path otherwise.
      const translated = data?.code ? t_ec(data.code) : '';
      toast.error(translated || data?.message || t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isPagesLoading) return <LoaderSpin />;

  if (!pages.length) return <ConnectInstagramAlert />;

  return (
    <div className="_welcome-message grid gap-3">
      <IceBreakerPageSelect
        accounts={pages}
        value={instagramId}
        onChange={setInstagramId}
        label={t('selectPage')}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <HandWavingIcon weight="duotone" /> {t('cardTitle')}
          </CardTitle>
          <CardDescription>{t('cardDescription')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5">
          {canEdit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSlots((current) => [...current, emptySlot()])}
              disabled={slots.length >= ICE_BREAKER_MAX || isLoading}
            >
              <CirclePlusIcon />
              {t('addQuestion')}
            </Button>
          )}

          {isLoading && <LoaderSpin />}

          {!isLoading && error && <ErrorMessage>{t('loadFailed')}</ErrorMessage>}

          {!isLoading && !error && slots.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-gray-700">{t('emptyTitle')}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{t('emptyDescription')}</p>
            </div>
          )}

          {!isLoading && slots.length > 0 && (
            <div className="_questions space-y-2">
              {slots.map((slot, index) => {
                const message = showErrors ? slotError(slot) : null;

                return (
                  <div key={slot.key} className="_item space-y-1">
                    {/* One row, one gap layer. The fields wrap together on narrow
                        screens; the index and delete button stay on the line. */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 shrink-0 text-center text-xs text-gray-400">
                        {index + 1}
                      </span>

                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <Input
                          className="w-full min-w-0 sm:flex-1"
                          value={slot.question}
                          onChange={(e) => updateSlot(slot.key, { question: e.target.value })}
                          placeholder={t('questionPlaceholder')}
                          maxLength={ICE_BREAKER_QUESTION_MAX_LENGTH}
                          disabled={!canEdit}
                          aria-invalid={!!message}
                        />

                        <div className="w-full sm:w-56">
                          <AutomationSearchSelect
                            value={slot.contentCycleId}
                            onSelect={(value) => updateSlot(slot.key, { contentCycleId: value })}
                            error={!!message}
                            placeholder={t('selectAutomation')}
                            instagramIds={instagramId ? [instagramId] : undefined}
                            initialData={
                              slot.contentCycleId && slot.conditions.length
                                ? { id: slot.contentCycleId, conditions: slot.conditions }
                                : undefined
                            }
                          />
                        </div>
                      </div>

                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={t('removeQuestion')}
                          onClick={() =>
                            setSlots((current) => current.filter((item) => item.key !== slot.key))
                          }
                        >
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      )}
                    </div>

                    {message && <ErrorMessage className="ps-6">{message}</ErrorMessage>}
                  </div>
                );
              })}
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end">
              <Button type="button" size="md" onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? t('saving') : t('save')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
