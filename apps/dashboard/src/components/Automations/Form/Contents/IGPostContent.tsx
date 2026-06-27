// src/components/Automations/Form/Contents/IGPostContent.tsx
'use client';

import { AutomationContentModeEnum } from '@/constants/automationContent.enum';
import { AutomationFormType } from '@/schemas/automationForm';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui';
import { IGPostContentDialog } from './IGPostContentDialog';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

const PAGE_SIZE = 9;

export type InstagramPostContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
};

export const IGPostContent = ({ index, mode }: InstagramPostContentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('Automations.Contents.InstagramPost');
  const t_err = useTranslations('Automations.Contents.InstagramPost.Errors');

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<AutomationFormType>();

  const fieldPath = mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders';

  // Watch the specific field directly
  const watchedPost = watch(`${fieldPath}.${index}.instagramPost`);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {watchedPost?.mediaUrl ? (
          <div className="relative aspect-square overflow-hidden rounded-lg bg-red-50">
            <Image
              src={watchedPost.mediaUrl}
              alt="Instagram post cover"
              width={250}
              height={0}
              className="aspect-square rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-t from-black to-transparent opacity-0 duration-150 hover:opacity-100">
              <Button
                type="button"
                className="text-white hover:no-underline"
                variant={'link'}
                size="sm"
                onClick={() => setIsOpen(true)}
              >
                {t('change')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              className="flex aspect-square h-full w-full items-center justify-center bg-gray-200 p-0 hover:bg-gray-300/90 hover:no-underline"
              type="button"
              variant="link"
              onClick={() => setIsOpen(true)}
            >
              {t('select')}
            </Button>

            {(errors as any)?.[fieldPath]?.[index]?.instagramPost && (
              <ErrorMessage className="col-span-3">{t_err('selection_required')}</ErrorMessage>
            )}
          </>
        )}
      </div>

      <IGPostContentDialog isOpen={isOpen} setIsOpen={setIsOpen} index={index} mode={mode} />
    </>
  );
};
