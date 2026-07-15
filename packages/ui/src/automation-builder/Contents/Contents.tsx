'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../constants/automationContent.enum';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FieldArrayWithId, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import useSWR from 'swr';
import { ContentTypeOption, contentTypeOptions } from './ContentTypeOptions';
import { TemplatePicker, type TemplateSummary } from '../TemplatePicker/TemplatePicker';
import { remapTemplateContents } from './remapTemplateContents';
import { useDebounce } from '../../hooks/useDebounce';
import type { AutomationBuilderMode } from '../AutomationBuilder.types';
// TODO: Refactor Types & Schemas
import type { AutomationFormType, ContentItemSchema } from '../schemas/automationForm';
import type { UploadedFile } from '@/types/fileUploader';
import { ButtonTypeEnum } from '../types/buttons.enum';

import { Alert, AlertDescription, AlertTitle, Button } from '@/components/ui';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { PlusCircleIcon } from 'lucide-react';
import { ContentItem } from './ContentItem';
import { ContentPromotion } from './ContentPromotion';
import { ContentsContext } from './ContentsContext';
import { ContentsUploaderContextProvider } from './ContentsUploaderContext';
import { ValidationTypeEnum } from '../types/validationType.enum';
import { QuestionTextErrorMessage } from './QuestionContent';
import { FilePlusIcon } from '@phosphor-icons/react/dist/ssr';
import { ChooseAutomationType } from './ChooseAutomationType';
import z from 'zod';
import { AutomationBuilderApiClient } from '../types/apiClient';

type ContentsProps = {
  mode: AutomationContentModeEnum;
  automationId?: string | undefined;
  apiClient: AutomationBuilderApiClient;
  /** Whether the currently-selected Instagram account(s) are on a "promotion" plan. The
   * caller computes this (it used to be computed here via a dashboard-only `useUser()`
   * hook) so this component stays app-agnostic. */
  isPromotion?: boolean;
  /** Rendered next to the "add content" button. Replaces the dashboard-only
   * `HelpMeDialog` that used to be hardcoded here. */
  helpSlot?: React.ReactNode;
  /** The top-level `AutomationBuilder`'s own `mode` (`'automation'` | `'template'`),
   * passed down so the `'template'` content-type option (Task 27 — insert an existing
   * template's content steps into this automation) can be hidden in `mode="template"`: a
   * template can't embed another template. Defaults to `'automation'` for callers that
   * render `Contents` directly outside `AutomationBuilder` (e.g. the dashboard's own
   * `Form/Reminder.tsx`), which are never in template mode. */
  builderMode?: AutomationBuilderMode;
};

// `GET /templates?search=` (core's `readTemplates`) returns a `PaginatedResult` body —
// `{ items, meta }` — same shape `CreateAutomationTemplateDialog.tsx` (Task 25/26)
// already consumes.
interface ReadTemplatesResponse {
  items: TemplateSummary[];
}

export const Contents = ({
  mode,
  automationId,
  apiClient,
  isPromotion,
  helpSlot,
  builderMode = 'automation',
}: ContentsProps) => {
  const t = useTranslations('Automations.Contents');
  const t_contentTypes = useTranslations('Automations.Contents.Types');
  const t_err = useTranslations('Automations.Contents.Errors');
  const t_templatePicker = useTranslations('Automations.TemplatePicker');

  const {
    control,
    trigger,
    clearErrors,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const [isChoosingType, setIsChoosingType] = useState(false);

  const arrayName =
    mode === AutomationContentModeEnum.REMINDER ? 'reminders' : ('contents' as const);

  const {
    fields: contents,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
    insert: insertContents,
  } = useFieldArray({
    control: control,
    name: arrayName as 'reminders' | 'contents',
    keyName: '_xid',
  });

  const watched = useWatch({ name: arrayName, control });
  const hasItems = (watched?.length ?? 0) > 0;

  useEffect(() => {
    if (
      hasItems &&
      ((errors as any)?.[arrayName]?.root?.message || (errors as any)?.[arrayName]?.message)
    ) {
      clearErrors(arrayName);
    }
  }, [hasItems, arrayName, clearErrors, errors]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over?.id) {
      const oldIndex = contents.findIndex((field) => field._xid === active.id);
      const newIndex = contents.findIndex((field) => field._xid === over?.id);

      moveContents(oldIndex, newIndex);
    }
  };

  const arrayErrors = (errors as any)?.[arrayName];
  const arrayErrorMsg = arrayErrors?.root?.message ?? arrayErrors?.message;
  const arrayErrorType = arrayErrors?.root?.type ?? arrayErrors?.type;

  // `'template'` content-type option (Task 27): opens the shared `TemplatePicker`,
  // pulls ONLY `contents[]` from the chosen template (never its triggers/conditions),
  // and appends the remapped items to the end of THIS form's own `contents`/`reminders`
  // array — no navigation, no touching triggers.
  const [isPickingTemplate, setIsPickingTemplate] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const debouncedTemplateSearch = useDebounce(templateSearch, 400);
  const [isInsertingTemplate, setIsInsertingTemplate] = useState(false);

  const { data: templatesResponse, isLoading: isTemplatesLoading } = useSWR<ReadTemplatesResponse>(
    isPickingTemplate ? `/templates?search=${encodeURIComponent(debouncedTemplateSearch)}` : null,
    (url: string) => apiClient.get(url).then((res) => res.data),
  );

  const insertTemplateHandler = async (template: TemplateSummary) => {
    setIsInsertingTemplate(true);
    try {
      const detail = await apiClient
        .get(`/templates/${template.id}`)
        .then((res) => res.data as { contents?: any[] });
      appendContents(remapTemplateContents(detail.contents ?? []));
      setIsPickingTemplate(false);
      setTemplateSearch('');
      clearErrors(arrayName);
    } finally {
      setIsInsertingTemplate(false);
    }
  };

  // The "insert template contents" convenience only makes sense in an automation's MAIN
  // content list. Hide it when:
  //  - builderMode === 'template' (a template can't embed another template), or
  //  - mode === REMINDER (a template's content graph — including a DELAY step that writes
  //    to `contents.N.delayMs`/`delayUnit` — doesn't fit the `reminders` array, which has no
  //    delay/consent fields; inserting one would silently drop data).
  const showTemplateInsert =
    builderMode === 'automation' && mode === AutomationContentModeEnum.AUTOMATION;

  const contentTypeOptionsForMode = showTemplateInsert
    ? contentTypeOptions
    : contentTypeOptions.filter((option) => option.value !== 'template');

  const selectAutomationTypeHandler = (option: ContentTypeOption) => {
    if (option.value === 'template') {
      setIsPickingTemplate(true);
      return;
    }

    console.log(`Selected Type: ${option.value} previous array: `, contents);
    appendContents({
      type: option.value === 'media' ? AutomationContentTypesEnum.IMAGE : option.value,
      ...(mode === AutomationContentModeEnum.AUTOMATION && {
        haveConsent: false,
      }),
      ...(option.value === AutomationContentTypesEnum.BUTTON_TEMPLATE && {
        buttonTemplate: {
          text: '',
          buttons: [
            {
              title: '',
            },
          ],
        },
      }),
      ...(option.value === AutomationContentTypesEnum.QUESTION && {
        validationType: ValidationTypeEnum.Text,
        validationErrorMessage: QuestionTextErrorMessage,
      }),
      ...(option.value === AutomationContentTypesEnum.VITRIN && {
        vitrins: [
          {
            imageId: '',
            imageUrl: '',
            title: '',
            description: '',
            buttons: [],
          },
        ],
      }),
      ...(option.value === AutomationContentTypesEnum.DELAY && {
        delayMs: 1000 * 60 * 60,
        delayUnit: 'hour',
      }),
    });
    console.log('After array: ', contents);
    clearErrors(arrayName);
  };

  const onContentDeleted = () => {};

  return (
    <ContentsContext.Provider value={{ contents, updateContents, removeContents }}>
      <div className="_content-item flex flex-col gap-3">
        {contents.length === 0 && (
          <div className="my-4 flex flex-col items-center justify-center">
            <FilePlusIcon size={100} className="mb-3 opacity-10" />
            <p className="font-bold text-gray-500">هنوز محتوایی اضافه نشده‌است</p>
            {/* <p className="text-center text-sm">
              روی دکمه "افزودن محتوا" کلیک کنید و نوع محتوای خود را انتخاب کنید
            </p> */}
          </div>
        )}
        {contents.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contents.map((field) => field._xid)}
              strategy={rectSortingStrategy}
            >
              {contents
                .filter((content) => !!content.type)
                .map((content, index) => (
                  <ContentsUploaderContextProvider
                    defaultValue={content.file as UploadedFile}
                    key={content._xid}
                  >
                    <ContentItem
                      onContentDeleted={onContentDeleted}
                      mode={mode}
                      id={content._xid}
                      index={index}
                      appendContents={appendContents}
                      content={content as FieldArrayWithId<z.infer<typeof ContentItemSchema>>}
                      apiClient={apiClient}
                    />
                  </ContentsUploaderContextProvider>
                ))}
            </SortableContext>
          </DndContext>
        )}

        <SortableContext
          disabled
          items={contents.map((field) => field._xid)}
          strategy={rectSortingStrategy}
        >
          {isPromotion && contents.length > 0 && mode === AutomationContentModeEnum.AUTOMATION && (
            <ContentPromotion />
          )}
        </SortableContext>

        <ChooseAutomationType
          open={isChoosingType}
          onOpenChange={setIsChoosingType}
          onSelect={selectAutomationTypeHandler}
          options={contentTypeOptionsForMode}
        />

        {/* Only ever mounted when `showTemplateInsert` — the `'template'` option that
            drives `isPickingTemplate` is filtered out of `contentTypeOptionsForMode`
            whenever this is false, so this branch also protects `t_templatePicker(...)`
            from resolving against a namespace the admin app's messages don't declare,
            and keeps it out of REMINDER mode (see `showTemplateInsert` above). */}
        {showTemplateInsert && (
          <TemplatePicker
            open={isPickingTemplate}
            onOpenChange={setIsPickingTemplate}
            templates={templatesResponse?.items ?? []}
            isLoading={isTemplatesLoading || isInsertingTemplate}
            search={templateSearch}
            onSearchChange={setTemplateSearch}
            onSelect={insertTemplateHandler}
            searchPlaceholder={t_templatePicker('searchPlaceholder')}
            emptyLabel={t_templatePicker('empty')}
          />
        )}

        {arrayErrorMsg && <ErrorMessage>{t_err(arrayErrorType) ?? arrayErrorMsg}</ErrorMessage>}

        {!isChoosingType && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="default"
              type="button"
              className="bg-primary flex-1 text-white"
              disabled={isChoosingType}
              onClick={() => setIsChoosingType(true)}
            >
              <PlusCircleIcon />
              {t('add_content')}
            </Button>
            <div className="flex shrink-0 items-center justify-center">{helpSlot}</div>
          </div>
        )}
      </div>
    </ContentsContext.Provider>
  );
};
