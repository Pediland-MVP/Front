'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import api, { fetcher } from '@/hooks/swr/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { useLabelFields } from './use-labels';
import { ScheduleControl, ScheduleValue } from './schedule-control';
import { RuleBuilder } from './rule-builder';
import {
  ConditionGroup,
  emptyGroup,
  Label as LabelType,
  CreateLabelPayload,
  LABEL_TARGET_TYPES,
  LabelTargetType,
} from './types';
import { collectFields, reconcileTargets, targetsForFields } from './labelTargets';

const SWATCHES = ['#16a34a', '#dc2626', '#d97706', '#2563eb', '#7c3aed', '#0891b2', '#475569'];

export function LabelFormDialog({
  open,
  onOpenChange,
  labelId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  labelId?: string;
  onSaved: () => void;
}) {
  const t = useTranslations('Labels');
  const t_ec = useTranslations('ERROR_CODES');
  const isEdit = !!labelId;
  const { fields } = useLabelFields();

  const { data: detail } = useSWR<{ data: LabelType }>(
    isEdit && open ? `/labels/${labelId}` : null,
    fetcher,
  );

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(SWATCHES[0]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleValue>({
    scheduleType: 'interval',
    intervalMinutes: 1440,
  });
  const [rule, setRule] = useState<ConditionGroup>(emptyGroup());
  const [targetTypes, setTargetTypes] = useState<LabelTargetType[]>(['user']);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && detail?.data) {
      const d = detail.data;
      setName(d.name);
      setColor(d.color ?? SWATCHES[0]);
      setDescription(d.description ?? '');
      setIsActive(d.isActive);
      setSchedule({
        scheduleType: d.scheduleType,
        intervalMinutes: d.intervalMinutes ?? undefined,
        dailyAtHour: d.dailyAtHour ?? undefined,
      });
      setRule(d.rule ?? emptyGroup());
      setTargetTypes(d.targetTypes?.length ? d.targetTypes : ['user']);
    } else {
      setName('');
      setColor(SWATCHES[0]);
      setDescription('');
      setIsActive(true);
      setSchedule({ scheduleType: 'interval', intervalMinutes: 1440 });
      setRule(emptyGroup());
      setTargetTypes(['user']);
    }
  }, [open, isEdit, labelId, detail]);

  // Fields used by the current rule, and the targets they jointly allow.
  const usedFields = useMemo(() => collectFields(rule), [rule]);
  const allowedTargets = useMemo(() => targetsForFields(usedFields, fields), [usedFields, fields]);

  // The little engine: when the field set changes, auto-untick any selected
  // target it no longer supports. Bail if nothing actually changed (avoids loops).
  useEffect(() => {
    setTargetTypes((prev) => {
      const next = reconcileTargets(prev, usedFields, fields);
      return next.length === prev.length && next.every((x, i) => x === prev[i]) ? prev : next;
    });
  }, [usedFields, fields]);

  const toggleTarget = (target: LabelTargetType) =>
    setTargetTypes((prev) =>
      prev.includes(target)
        ? prev.filter((x) => x !== target)
        : LABEL_TARGET_TYPES.filter((t2) => prev.includes(t2) || t2 === target),
    );
  const selectAllTargets = () => setTargetTypes(allowedTargets);

  // Live preview (debounced) — per-target match counts for the current draft.
  const [debouncedRule] = useDebounce(rule, 800);
  const [previewCounts, setPreviewCounts] = useState<Partial<
    Record<LabelTargetType, number>
  > | null>(null);
  const [previewing, setPreviewing] = useState(false);
  useEffect(() => {
    if (!open || debouncedRule.conditions.length === 0 || targetTypes.length === 0) {
      setPreviewCounts(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    api
      .post<{ data: { counts: Partial<Record<LabelTargetType, number>> } }>('/labels/preview', {
        rule: debouncedRule,
        targetTypes,
      })
      .then((r) => !cancelled && setPreviewCounts(r.data.data.counts))
      .catch(() => !cancelled && setPreviewCounts(null))
      .finally(() => !cancelled && setPreviewing(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedRule, open, targetTypes]);

  const buildPayload = (): CreateLabelPayload => ({
    name: name.trim(),
    color,
    description: description.trim() || undefined,
    rule,
    targetTypes,
    scheduleType: schedule.scheduleType,
    intervalMinutes: schedule.scheduleType === 'interval' ? schedule.intervalMinutes : undefined,
    dailyAtHour: schedule.scheduleType === 'daily' ? schedule.dailyAtHour : undefined,
    isActive,
  });

  const submit = async () => {
    if (!name.trim()) return toast.error(t('validationNameRequired'));
    if (rule.conditions.length === 0) return toast.error(t('validationRuleEmpty'));
    if (targetTypes.length === 0) return toast.error(t('validationTargetEmpty'));
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/labels/${labelId}`, buildPayload());
        toast.success(t('toastUpdated'));
      } else {
        await api.post('/labels', buildPayload());
        toast.success(t('toastCreated'));
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t('toastError'));
    } finally {
      setSubmitting(false);
    }
  };

  const recomputeNow = async () => {
    if (!isEdit) return;
    try {
      const res = await api.post<{ data: { matchedCount: number } }>(
        `/labels/${labelId}/recompute`,
      );
      toast.success(t('recomputeDone', { count: res.data.data.matchedCount }));
      onSaved();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t('toastError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('formName')}</Label>
            <Input
              value={name}
              placeholder={t('formNamePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>{t('formColor')}</Label>
            <div className="flex gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('formDescription')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('targetSelectorLabel')}</Label>
            <div className="flex flex-wrap items-center gap-4">
              {LABEL_TARGET_TYPES.map((target) => {
                const disabled = !allowedTargets.includes(target);
                return (
                  <label
                    key={target}
                    className={`flex cursor-pointer items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    <Checkbox
                      checked={targetTypes.includes(target)}
                      disabled={disabled}
                      onCheckedChange={() => toggleTarget(target)}
                    />
                    <span>{t(`targetTypes.${target}`)}</span>
                  </label>
                );
              })}
              <Button type="button" size="sm" variant="outline" onClick={selectAllTargets}>
                {t('targetTypes.all')}
              </Button>
            </div>
          </div>

          <ScheduleControl value={schedule} onChange={setSchedule} />

          <div className="space-y-2">
            <Label>{t('rule')}</Label>
            <RuleBuilder value={rule} onChange={setRule} fields={fields} />
            <p className="text-muted-foreground text-sm">
              {previewing
                ? t('previewLoading')
                : previewCounts
                  ? LABEL_TARGET_TYPES.filter((tt) => previewCounts[tt] != null)
                      .map((tt) =>
                        t('previewPerTarget', {
                          target: t(`targetTypes.${tt}`),
                          count: previewCounts[tt] ?? 0,
                        }),
                      )
                      .join(' · ')
                  : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="label-active" />
            <Label htmlFor="label-active">{t('formActive')}</Label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit ? (
              <Button type="button" variant="outline" onClick={recomputeNow}>
                <ArrowsClockwiseIcon size={18} className="ml-1" /> {t('recomputeNow')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button type="button" disabled={submitting} onClick={submit}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
