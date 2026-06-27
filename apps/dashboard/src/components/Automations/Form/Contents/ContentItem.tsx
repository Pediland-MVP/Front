'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/constants/automationContent.enum';
import type { AutomationFormType } from '@/schemas/automationForm';
import type { UploadedFile } from '@/types/fileUploader';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import {
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayReturn,
  useFormContext,
} from 'react-hook-form';

import { ArrowsOutCardinalIcon, TrashSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { ButtonContent } from './ButtonContent';
import { useContentsContext } from './ContentsContext';
import { IGPostContent } from './IGPostContent';
import { MediaContent } from './MediaContent';
import { ProductContentComp } from './ProductContent';
import { TextContent } from './TextContent';
import { QuestionContent } from './QuestionContent';
import { ContentItemSchema } from '../../../../schemas/automationForm';
import { z } from 'zod';
import VitrinContent from './VitrinContent';
import { useEffect } from 'react';
import { DelayContent } from './DelayContent';

interface ReturnContentProps {
  index: number;
  type: AutomationContentTypesEnum;
  mode: AutomationContentModeEnum;
  appendContents: UseFieldArrayAppend<z.infer<typeof ContentItemSchema>>;
  content: z.infer<typeof ContentItemSchema>;
}

export const ReturnContent = ({
  index,
  type,
  mode,
  appendContents,
  content,
}: ReturnContentProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  switch (type) {
    case AutomationContentTypesEnum.TEXT:
      return <TextContent control={control} mode={mode} index={index} />;

    case AutomationContentTypesEnum.INSTAGRAM_POST:
      return <IGPostContent mode={mode} index={index} />;

    case AutomationContentTypesEnum.PRODUCT:
      return <ProductContentComp mode={mode} index={index} />;

    case AutomationContentTypesEnum.BUTTON_TEMPLATE:
      return <ButtonContent mode={mode} contentIndex={index} />;

    case AutomationContentTypesEnum.QUESTION:
      return <QuestionContent control={control} mode={mode} index={index} />;

    case AutomationContentTypesEnum.VITRIN:
      return <VitrinContent index={index} mode={mode} control={control} />;

    case AutomationContentTypesEnum.DELAY:
      return <DelayContent index={index} />;

    default:
      return (
        <MediaContent
          content={content}
          appendContents={appendContents}
          index={index}
          mode={mode}
          type={type}
        />
      );
  }
};

export const ContentItem = ({
  id,
  index,
  mode,
  onContentDeleted,
  appendContents,
  content,
}: {
  id: string;
  index: number;
  mode: AutomationContentModeEnum;
  isPromotion?: boolean;
  defaultUploaderValue?: UploadedFile | null;
  onContentDeleted: (index: number) => any;
  appendContents: UseFieldArrayAppend<z.infer<typeof ContentItemSchema>>;
  content: z.infer<typeof ContentItemSchema>;
}) => {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<AutomationFormType>();

  useEffect(() => {
    console.log('Errors of AutomationForm', JSON.stringify(errors, undefined, ' '));
  }, [errors]);

  const t = useTranslations('Automations.Contents');
  const t_contentTypes = useTranslations('Automations.Contents.Types');

  let { removeContents, updateContents, contents } = useContentsContext();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    onContentDeleted(index);
    removeContents(index);
    const newList =
      mode === AutomationContentModeEnum.AUTOMATION ? getValues().contents : getValues().reminders;

    if (newList && newList.length === 1) {
      updateContents(0, {
        ...newList[0],
      });
    }
  };

  // *************** NEVE USED ???????
  const handleContentTypeChange = async (type: AutomationContentTypesEnum | 'media') => {
    // Create a new content object with the selected type
    //NOTE: Default values of the new content
    const updatedContent = {
      ...contents[index],
      type,
      // Reset content-specific fields when changing type
      ...(type === AutomationContentTypesEnum.TEXT && {
        file: null,
        quickReplies: [],
      }),
      ...(type === AutomationContentTypesEnum.INSTAGRAM_POST && {
        file: null,
      }),
      ...(type === AutomationContentTypesEnum.PRODUCT && {
        products: [{}],
      }),
      ...(type === AutomationContentTypesEnum.BUTTON_TEMPLATE
        ? {
            buttonTemplate: {
              text: '',
              buttons: [
                {
                  url: '',
                  text: '',
                },
              ],
            },
          }
        : {
            buttonTemplate: null,
          }),
      ...(type !== AutomationContentTypesEnum.TEXT && { text: undefined }),
    };

    // Update the form field
    updateContents(index, updatedContent);

    // Trigger form validation
    await trigger(
      `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}`,
    );

    clearErrors('contents.0.buttonTemplate');
  };

  const typeKey = contents?.[index]?.type as string | undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-start gap-y-4 rounded-xl border border-dashed border-blue-200/75 bg-blue-50/60 p-3 hover:border-blue-300"
    >
      <div className="_header flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-move touch-none">
            <ArrowsOutCardinalIcon size={18} className="text-gray-500 hover:text-blue-900" />
          </div>
          <div className="text-secondary flex gap-2 text-[13px] font-semibold">
            <div className="bg-secondary flex size-5.5 items-center justify-center rounded-full p-0 text-xs leading-px font-medium text-white">
              {index + 1}
            </div>
            {t_contentTypes(`buttons.descriptions.${typeKey}`)}
          </div>
        </div>
        <div>
          <TrashSimpleIcon
            size={20}
            className="cursor-pointer text-red-600"
            onClick={deleteContent}
            aria-label={t('remove_content')}
          />
        </div>
      </div>

      <div className="_content flex w-full flex-col gap-3">
        <ReturnContent
          mode={mode}
          index={index}
          type={contents?.[index]?.type || AutomationContentTypesEnum.TEXT}
          appendContents={appendContents}
          content={content}
        />
      </div>
    </div>
  );
};
