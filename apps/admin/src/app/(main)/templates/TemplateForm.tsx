'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useForm, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import api, { fetcher } from '@/hooks/swr/api-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import MultipleSelector, { type Option } from '@/components/ui/multi-selector';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import {
  AutomationBuilder,
  AutomationContentTypesEnum,
  ButtonTypeEnum,
  useI18nZodErrors,
} from '@/components/automation-builder';
import type { AutomationFormType } from '@/components/automation-builder';
import { templateAutomationApiClient } from '@/lib/templateAutomationApiClient';

// Mirrors the backend's `TEMPLATE_IMAGE_FILE_TYPE` allowlist
// (Back/apps/admin/src/templates/templates.controller.ts) — an explicit MIME allowlist,
// not a bare `image/*`, since `image/svg+xml` can embed `<script>` and uploaded files are
// served back with `ContentDisposition: 'inline'`.
const TEMPLATE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TEMPLATE_IMAGE_MAX_SIZE = 3_000_000;

// `AutomationFormSchema.instagramIds` (packages/ui/src/automation-builder/schemas/automationForm.ts)
// requires at least one entry regardless of `mode` — the shared schema was moved into
// packages/ui unchanged (Task 16) and was never made template-aware. Templates have no
// workspace/Instagram context, so this is a fixed placeholder purely to satisfy client-side
// validation; `CreateTemplateDto`/`UpdateTemplateDto` don't declare an `instagramIds` field
// and the admin's `ValidationPipe({ whitelist: true })` silently strips it, so it's never
// persisted or read back.
const TEMPLATE_PLACEHOLDER_INSTAGRAM_ID = '00000000-0000-4000-8000-000000000000';

interface TemplateMetaValues {
  templateTitle: string;
  templateDescription: string;
  appliesToAllCategories: boolean;
  categoryIds: Option[];
}

interface TemplateFormProps {
  id?: string;
}

// Mirrors the dashboard's own `transformButtons` (`apps/dashboard/src/components/
// Automations/AutomationForm.tsx`) — normalizes a raw `ButtonTemplateItem` row's
// `type`/`postbackPayloadType` columns into the frontend `ButtonTypeEnum` the shared
// `ButtonSchema` discriminates on. In practice the admin's `GET /templates/:id`
// (`Back/apps/admin/src/templates/templates.service.ts#readOneTemplate`) already writes
// `postbackPayloadType` with a frontend-compatible value at create/update time, but this
// stays defensive (same as the dashboard) in case of legacy rows.
function transformButtons(buttons: any[] | undefined | null) {
  return buttons?.map((b: any) => {
    const btn = { ...b };
    const typeToNormalize = btn.postbackPayloadType || btn.type;

    if (typeToNormalize) {
      const lowerType = String(typeToNormalize).toLowerCase();
      if (lowerType === 'text' || lowerType === ButtonTypeEnum.TEXT.toLowerCase()) {
        btn.postbackPayloadType = ButtonTypeEnum.TEXT;
      } else if (lowerType === 'url' || lowerType === ButtonTypeEnum.URL.toLowerCase()) {
        btn.postbackPayloadType = ButtonTypeEnum.URL;
      } else if (
        lowerType === 'contentcycle' ||
        lowerType === 'automation' ||
        lowerType === ButtonTypeEnum.START_AUTOMATION.toLowerCase()
      ) {
        btn.postbackPayloadType = ButtonTypeEnum.START_AUTOMATION;
      } else if (lowerType === ButtonTypeEnum.CONSENT.toLowerCase()) {
        btn.postbackPayloadType = ButtonTypeEnum.CONSENT;
      }
    }

    if (
      btn.postbackPayloadType === ButtonTypeEnum.START_AUTOMATION &&
      btn.destinationContentCycle
    ) {
      btn.destinationContentCycleId = btn.destinationContentCycle.id;
    }

    return btn;
  });
}

// Mirrors the dashboard's own `transformContent` — maps a raw `ContentCycleContent` row
// (vitrin images array -> single imageId/imageUrl, button normalization, delay unit) into
// the shape `ContentItemSchema` expects. Note: fixes a pre-existing typo in the dashboard's
// copy (it reads `content.vitrins.buttons` instead of `v.buttons` when mapping each vitrin
// item), since this is a fresh adaptation, not a byte-for-byte copy.
function transformContent(c: any) {
  const content = { ...c };

  if (content.buttonTemplate?.buttons) {
    content.buttonTemplate = { ...content.buttonTemplate };
    const buttons = transformButtons(content.buttonTemplate.buttons);
    buttons?.sort((a: any, b: any) => (a.priority ?? 9999) - (b.priority ?? 9999));
    content.buttonTemplate.buttons = buttons;
  }

  if (content.vitrins?.length) {
    content.vitrins = content.vitrins.map((v: any) => ({
      ...v,
      imageId: v.images?.[0]?.id,
      imageUrl: v.images?.[0]?.url,
      ...(v.buttons?.length && { buttons: transformButtons(v.buttons) }),
    }));
  }

  if (content.type === AutomationContentTypesEnum.DELAY) {
    if (content.delayMs >= 1000 * 60 * 60) {
      content.delayUnit = 'hour';
    } else if (content.delayMs >= 1000 * 60) {
      content.delayUnit = 'min';
    } else {
      content.delayUnit = 'sec';
    }
  }

  return content;
}

// Maps the real `GET /templates/:id` response (a raw `ContentCycle` entity graph — see
// the `readOneTemplate` note above) into both the shared `AutomationBuilder`'s
// `initialValue` shape and this form's own `metaForm` values. `categoryOptions` (the
// already-fetched `/workspace-categories` list) supplies the `{ value, label }` pairs for
// `template.categoryIds` — the backend only returns raw ids (no nested category rows), so
// a category missing from that list (not loaded yet, or since deleted) falls back to
// showing its own id as the label rather than being dropped silently.
function transformTemplateToFormValues(
  template: any,
  categoryOptions: Option[],
): { initialValue: Partial<AutomationFormType>; meta: TemplateMetaValues } {
  const categoryIds: string[] =
    template.categoryIds ?? (template.categories ?? []).map((c: { id: string }) => c.id);

  const initialValue: Partial<AutomationFormType> = {
    ...template,
    instagramIds: [TEMPLATE_PLACEHOLDER_INSTAGRAM_ID],
    conditionType: template.isNoCondition
      ? 'noCondition'
      : (template.conditions?.[0]?.type ?? 'noCondition'),
    contents: (template.contents ?? []).map(transformContent),
  };

  const meta: TemplateMetaValues = {
    templateTitle: template.templateTitle ?? '',
    templateDescription: template.templateDescription ?? '',
    appliesToAllCategories: template.templateAppliesToAllCategories ?? false,
    categoryIds: categoryIds.map(
      (categoryId) =>
        categoryOptions.find((option) => option.value === categoryId) ?? {
          value: categoryId,
          label: categoryId,
        },
    ),
  };

  return { initialValue, meta };
}

export default function TemplateForm({ id }: TemplateFormProps) {
  // Localizes `AutomationFormSchema`'s zod validation messages (Persian) — same shared
  // hook the dashboard's own `AutomationForm.tsx` calls. See `useI18nZodErrors.ts` (in
  // `packages/ui`) for why this must be the package's own hook rather than an
  // admin-local copy.
  useI18nZodErrors();
  const t = useTranslations('Templates');
  const t_ec = useTranslations('ERROR_CODES');
  // Same generic "please fix the form" toast the dashboard's own `AutomationForm.tsx`
  // shows via its `onInvalid` — reuses the identical `Automations.form_errors` key (already
  // present in admin's fa.json) rather than adding a new, redundant Templates-namespace copy.
  const t_automations = useTranslations('Automations');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // `GET /templates/:id` (`Back/apps/admin/src/templates/templates.service.ts#readOneTemplate`)
  // returns the raw `ContentCycle` entity graph (contents + nested buttonTemplate/vitrins/
  // quickReplies/file/conditions/templateImage) plus an added `categoryIds: string[]` — see
  // `transformTemplateToFormValues` above for how that raw shape gets normalized.
  const {
    data: template,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useSWRImmutable(id ? `/templates/${id}` : null, fetcher);

  const { data: categoriesResponse } = useSWR('/workspace-categories?limit=100', fetcher);
  const categoryOptions: Option[] = useMemo(
    () =>
      (categoriesResponse?.items ?? []).map((c: { id: string; nameFa: string }) => ({
        value: c.id,
        label: c.nameFa,
      })),
    [categoriesResponse],
  );

  const metaForm = useForm<TemplateMetaValues>({
    defaultValues: {
      templateTitle: '',
      templateDescription: '',
      appliesToAllCategories: false,
      categoryIds: [],
    },
  });

  // `categoryOptions` is recomputed (new array reference) on every render of its own
  // `useMemo` above, since `useSWR` hands back a fresh object on each revalidation — depend
  // on this derived, primitive key instead of the array itself, so the effect below only
  // re-runs when the actual set of loaded category ids changes, not on every unrelated render.
  const categoryOptionsKey = categoryOptions.map((option) => option.value).join(',');

  // Full prefill — runs exactly once per loaded template. Gated ONLY on `template` (NOT on
  // `categoryOptionsKey`): `template` (`useSWRImmutable`) and the category options
  // (a separate `useSWR`) are independent fetches that can resolve in either order. If this
  // effect also re-ran on `categoryOptionsKey` changing, a second `metaForm.reset(meta)`
  // would silently overwrite any edit the admin made to templateTitle/templateDescription/
  // appliesToAllCategories in the window between the two fetches resolving (see the
  // label-backfill effect below for how the late-arriving category labels get applied
  // instead, without a second full reset).
  useEffect(() => {
    if (!template) return;
    const { meta } = transformTemplateToFormValues(template, categoryOptions);
    metaForm.reset(meta);
    setThumbnailPreviewUrl(template.templateImage?.url ?? null);
    // `metaForm` is a stable react-hook-form instance; `categoryOptions` is intentionally
    // excluded — see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // Label backfill — reacts ONLY to `categoryOptions` finishing loading (`categoryOptionsKey`
  // changes at most once, since it comes from a plain non-paginated `useSWR` fetch). Re-reads
  // the form's CURRENT values via `getValues` (rather than depending on them) and only ever
  // calls `setValue('categoryIds', ...)` — never `reset` — so it can never clobber
  // templateTitle/templateDescription/appliesToAllCategories or any other field the admin may
  // be mid-edit on. It's also a no-op (no `setValue` call) when nothing actually changed, so
  // it doesn't cause an extra render on top of the one `categoryOptionsKey` itself already
  // caused.
  useEffect(() => {
    if (!template) return;
    const { appliesToAllCategories, categoryIds } = metaForm.getValues();
    if (appliesToAllCategories || !categoryIds.length) return;

    const relabeledCategoryIds = categoryIds.map(
      (option) => categoryOptions.find((candidate) => candidate.value === option.value) ?? option,
    );
    const labelsChanged = relabeledCategoryIds.some(
      (option, index) => option.label !== categoryIds[index].label,
    );
    if (!labelsChanged) return;

    metaForm.setValue('categoryIds', relabeledCategoryIds);
    // `metaForm`/`categoryOptions` are read via `getValues`/closure on purpose — see the
    // comment above; only `categoryOptionsKey` (and `template`'s presence) should retrigger
    // this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptionsKey, template]);

  const appliesToAll = metaForm.watch('appliesToAllCategories');

  const validateThumbnailFile = (file: File) => {
    if (!TEMPLATE_IMAGE_MIME_TYPES.includes(file.type)) {
      toast.error(t('invalidImageFormat'));
      return false;
    }
    if (file.size > TEMPLATE_IMAGE_MAX_SIZE) {
      toast.error(t('imageTooLarge'));
      return false;
    }
    return true;
  };

  const uploadThumbnailNow = async (templateId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setThumbnailUploading(true);
    try {
      const res = await api.post(`/templates/${templateId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setThumbnailPreviewUrl(res.data?.data?.url ?? null);
      toast.success(t('thumbnailUploadSuccess'));
    } catch {
      toast.error(t('thumbnailUploadFailed'));
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleThumbnailChange = (file: File) => {
    if (!validateThumbnailFile(file)) return;

    if (id) {
      // Edit mode: the template id already exists, so upload straight away — same
      // immediate-upload pattern as the guides thumbnail uploader
      // (apps/admin/src/app/(main)/guides/guides-table.tsx).
      void uploadThumbnailNow(id, file);
      return;
    }

    // Create mode: there is no id-less thumbnail-upload endpoint (only the content-step
    // uploader, `POST /templates/upload-content`, is id-less) — `POST /templates/:id/upload-image`
    // needs an id that doesn't exist yet. Defer the actual upload until the template is
    // created (see `onSubmitTemplate`), and only preview the file locally until then.
    setThumbnailFile(file);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
  };

  const initialValue = useMemo((): Partial<AutomationFormType> | undefined => {
    if (template) {
      return transformTemplateToFormValues(template, categoryOptions).initialValue;
    }

    if (id) return undefined; // edit mode, template not loaded yet

    // Brand-new template: seeded only with the fields that are genuinely irrelevant to a
    // template's real content (`instagramIds` is a fixed placeholder stripped server-side,
    // see the `TEMPLATE_PLACEHOLDER_INSTAGRAM_ID` note above; `isDirect: true` just satisfies
    // the shared schema's isDirect-or-isComment check). `contents` is deliberately left
    // empty — the shared `AutomationFormSchema`'s `contents.min(1)` then correctly forces
    // the admin to author real content before they can save; a contentless template would
    // otherwise persist as literal junk.
    return {
      instagramIds: [TEMPLATE_PLACEHOLDER_INSTAGRAM_ID],
      conditionType: 'noCondition',
      conditions: [],
      isDirect: true,
      isComment: false,
      contents: [],
    };
    // Computed once and handed to `AutomationBuilder`'s own `useForm` at mount only (it
    // doesn't react to later changes) — same rationale as the dashboard's own
    // `AutomationForm.tsx`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, id]);

  const onSubmitTemplate = async (values: AutomationFormType) => {
    // The metadata fields live in a separate `metaForm` (rendered in `headerSlot`) that
    // `AutomationBuilder`'s own zod validation never sees — validate them here, before any
    // network call, so a blank title/description gets a field-level error instead of a
    // generic un-coded 400 from the backend's `@Length(1, ...)` DTO validators.
    const metaValid = await metaForm.trigger(['templateTitle', 'templateDescription']);
    if (!metaValid) {
      const firstInvalidField = metaForm.formState.errors.templateTitle
        ? 'templateTitle'
        : 'templateDescription';
      metaForm.setFocus(firstInvalidField);
      return;
    }

    const meta = metaForm.getValues();
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        templateTitle: meta.templateTitle,
        templateDescription: meta.templateDescription,
        appliesToAllCategories: meta.appliesToAllCategories,
        categoryIds: meta.appliesToAllCategories ? [] : meta.categoryIds.map((c) => c.value),
      };

      if (id) {
        await api.patch(`/templates/${id}`, payload);
        toast.success(t('updateSuccess'));
      } else {
        const res = await api.post('/templates', payload);
        const newId = res.data?.data?.id;
        if (newId && thumbnailFile) {
          await uploadThumbnailNow(newId, thumbnailFile);
        }
        toast.success(t('createSuccess'));
      }
      router.push('/templates');
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mirrors the dashboard's own `AutomationForm.tsx`'s `handleBeforeSubmit` — templates
  // can contain DELAY content items too (see `transformContent` above), but this form had
  // no equivalent guard against their total exceeding the shared 23h budget.
  const handleBeforeSubmit = (values: AutomationFormType): boolean => {
    let totalDelaysMs = 0;
    values.contents.forEach((c) => {
      if (c.type === AutomationContentTypesEnum.DELAY) {
        totalDelaysMs += c.delayMs ?? 0;
      }
    });

    if (totalDelaysMs > 1000 * 60 * 60 * 23) {
      toast.error(t_automations('Contents.Errors.totalDelayMsShouldBeUnder23Hour'));
      return false;
    }

    return true;
  };

  // `AutomationBuilder`'s internal `form.handleSubmit`'s "onInvalid" callback — mirrors
  // the dashboard's own `AutomationForm.tsx`'s `handleInvalid`, giving top-level feedback
  // when the shared `zodResolver` rejects the submit (e.g. a failing field scrolled out of
  // view), instead of the admin silently doing nothing.
  const handleInvalid = () => {
    toast.error(t_automations('form_errors'));
  };

  if (id && isTemplateLoading && !template) return <Loading />;
  if (id && templateError) return <FetchError />;

  return (
    <div className="flex flex-col gap-5 p-4">
      <AutomationBuilder
        mode="template"
        apiClient={templateAutomationApiClient}
        initialValue={initialValue}
        isSubmitting={isSubmitting}
        onSubmit={onSubmitTemplate}
        onInvalid={handleInvalid}
        beforeSubmit={handleBeforeSubmit}
        onCancel={() => router.push('/templates')}
        submitLabel={isSubmitting ? t('saving') : t('save')}
        cancelLabel={t('cancel')}
        headerSlot={
          <div className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="templateTitle">{t('label')}</Label>
              <Input
                id="templateTitle"
                aria-invalid={!!metaForm.formState.errors.templateTitle}
                {...metaForm.register('templateTitle', {
                  required: t('templateTitleRequired'),
                  maxLength: { value: 150, message: t('templateTitleMaxLength') },
                })}
              />
              {metaForm.formState.errors.templateTitle && (
                <ErrorMessage>{metaForm.formState.errors.templateTitle.message}</ErrorMessage>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="templateDescription">{t('description')}</Label>
              <Textarea
                id="templateDescription"
                aria-invalid={!!metaForm.formState.errors.templateDescription}
                {...metaForm.register('templateDescription', {
                  required: t('templateDescriptionRequired'),
                  maxLength: { value: 500, message: t('templateDescriptionMaxLength') },
                })}
              />
              {metaForm.formState.errors.templateDescription && (
                <ErrorMessage>{metaForm.formState.errors.templateDescription.message}</ErrorMessage>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="appliesToAllCategories"
                checked={appliesToAll}
                onCheckedChange={(checked) => {
                  metaForm.setValue('appliesToAllCategories', checked);
                  if (checked) metaForm.setValue('categoryIds', []);
                }}
              />
              <Label htmlFor="appliesToAllCategories">{t('appliesToAllCategories')}</Label>
            </div>

            {!appliesToAll && (
              <Controller
                control={metaForm.control}
                name="categoryIds"
                render={({ field }) => (
                  <MultipleSelector
                    value={field.value}
                    onChange={field.onChange}
                    defaultOptions={categoryOptions}
                    placeholder={t('chooseCategories')}
                  />
                )}
              />
            )}

            <div className="grid gap-1.5">
              <Label>{t('uploadThumbnail')}</Label>
              <input
                type="file"
                id="template-thumbnail-upload"
                className="hidden"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThumbnailChange(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('template-thumbnail-upload')?.click()}
                disabled={thumbnailUploading}
                className="border-input flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border text-center text-xs"
              >
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                ) : thumbnailUploading ? (
                  t('uploadingThumbnail')
                ) : (
                  t('uploadThumbnail')
                )}
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
