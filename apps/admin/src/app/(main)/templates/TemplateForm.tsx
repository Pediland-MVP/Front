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
import { AutomationBuilder, AutomationContentTypesEnum } from '@/components/automation-builder';
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

export default function TemplateForm({ id }: TemplateFormProps) {
  const t = useTranslations('Templates');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // NOTE (backend gap): the admin `TemplatesController` currently only exposes
  // GET/POST /templates, PATCH/DELETE /templates/:id and the two upload routes — there is
  // no `GET /templates/:id` single-detail route (see
  // Back/apps/admin/src/templates/templates.controller.ts and
  // Back/knowledge/admin/templates/templates.doc.md). Only core's read-only mirror
  // (consumed by the dashboard) has one. This fetch is wired against the contract this
  // task was scoped for; until Back adds the route, editing an existing template will 404
  // and fall through to the `<FetchError />` branch below instead of loading real data.
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

  useEffect(() => {
    if (!template) return;
    metaForm.reset({
      templateTitle: template.templateTitle ?? '',
      templateDescription: template.templateDescription ?? '',
      appliesToAllCategories: template.templateAppliesToAllCategories ?? false,
      categoryIds: (template.categories ?? []).map((c: { id: string; nameFa: string }) => ({
        value: c.id,
        label: c.nameFa,
      })),
    });
    setThumbnailPreviewUrl(template.templateImage?.url ?? null);
    // `metaForm` is a stable react-hook-form instance; only re-run when the fetched
    // template itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

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
      return {
        ...template,
        instagramIds: [TEMPLATE_PLACEHOLDER_INSTAGRAM_ID],
        conditionType: template.isNoCondition
          ? 'noCondition'
          : (template.conditions?.[0]?.type ?? 'noCondition'),
      };
    }

    if (id) return undefined; // edit mode, template not loaded yet

    // Brand-new template: seeded with a minimal-but-valid automation shape so the shared
    // `AutomationFormSchema` (which unconditionally requires `instagramIds`/`contents`,
    // see the `TEMPLATE_PLACEHOLDER_INSTAGRAM_ID` note above) doesn't block a save before
    // the admin has touched the Conditions/Contents sections at all — mirrors a fresh
    // automation's own sane defaults (direct-message trigger, no condition yet).
    return {
      instagramIds: [TEMPLATE_PLACEHOLDER_INSTAGRAM_ID],
      conditionType: 'noCondition',
      conditions: [],
      isDirect: true,
      isComment: false,
      contents: [{ type: AutomationContentTypesEnum.TEXT, text: t('defaultContentText') }],
    };
    // Computed once and handed to `AutomationBuilder`'s own `useForm` at mount only (it
    // doesn't react to later changes) — same rationale as the dashboard's own
    // `AutomationForm.tsx`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, id]);

  const onSubmitTemplate = async (values: AutomationFormType) => {
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
        onCancel={() => router.push('/templates')}
        submitLabel={isSubmitting ? t('saving') : t('save')}
        cancelLabel={t('cancel')}
        headerSlot={
          <div className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid gap-1.5">
              <Label htmlFor="templateTitle">{t('label')}</Label>
              <Input id="templateTitle" {...metaForm.register('templateTitle')} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="templateDescription">{t('description')}</Label>
              <Textarea id="templateDescription" {...metaForm.register('templateDescription')} />
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
