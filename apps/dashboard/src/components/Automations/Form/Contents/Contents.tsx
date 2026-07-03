'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/constants/automationContent.enum';
import useUser from '@/hooks/useUser';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FieldArrayWithId, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { WizardVideoLinks } from '../../wizardVideoLinks.conf';
import { ContentTypeOption, contentTypeOptions } from './ContentTypeOptions';
// TODO: Refactor Types & Schemas
import type { AutomationFormType, ContentItemSchema } from '@/schemas/automationForm';
import type { UploadedFile } from '@/types/fileUploader';
import { ButtonTypeEnum } from '@/types/buttons.enum';

import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
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
import { ValidationTypeEnum } from '@/types/validationType.enum';
import { QuestionTextErrorMessage } from './QuestionContent';
import { FilePlusIcon } from '@phosphor-icons/react/dist/ssr';
import { ChooseAutomationType } from './ChooseAutomationType';
import z from 'zod';

type ContentsProps = {
  mode: AutomationContentModeEnum;
  automationId?: string | undefined;
};

export const Contents = ({ mode, automationId }: ContentsProps) => {
  const t = useTranslations('Automations.Contents');
  const t_contentTypes = useTranslations('Automations.Contents.Types');
  const t_err = useTranslations('Automations.Contents.Errors');
  const { user } = useUser();

  const {
    control,
    trigger,
    clearErrors,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const selectedInstagramId = useWatch({ control, name: 'instagramId' });
  const isPromotion =
    user?.instagrams?.find((i) => i.id === selectedInstagramId)?.isPromotion ?? false;

  const [isChoosingType, setIsChoosingType] = useState(
    !!automationId || mode === AutomationContentModeEnum.REMINDER ? false : true,
  );

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

  const selectAutomationTypeHandler = (option: ContentTypeOption) => {
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
    setIsChoosingType(false);
    clearErrors(arrayName);
  };

  const onContentDeleted = (index: any) => {
    if (index === 0) {
      setIsChoosingType(true);
    }
  };

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

        {isChoosingType && <ChooseAutomationType onSelect={selectAutomationTypeHandler} />}

        {arrayErrorMsg && <ErrorMessage>{t_err(arrayErrorType) ?? arrayErrorMsg}</ErrorMessage>}

        {contents.length > 0 && !isChoosingType && (
          <div className="flex items-center justify-center">
            <Button
              variant="default"
              type="button"
              className="bg-primary w-11/12 text-white"
              disabled={isChoosingType}
              onClick={() => setIsChoosingType(true)}
            >
              <PlusCircleIcon />
              {t('add_content')}
            </Button>
            <div className="relative w-1/12">
              <HelpMeDialog
                position="center"
                title={t('Help.title')}
                description={t('Help.description')}
                videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
              />
            </div>
          </div>
        )}
      </div>
    </ContentsContext.Provider>
  );
};
