'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useAutomationDefaults } from '@/hooks/useAutomationDefaults';
import { WizardVideoLinks } from '../wizardVideoLinks.conf';

import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from '@/components/ui';
import { SeperateLine } from '@/components/ui-custom/SeperateLine';
import { PlusCircleIcon, TextboxIcon, TrashSimpleIcon } from '@phosphor-icons/react/dist/ssr';

export const CommentReplies = () => {
  const { watch, control, setValue, clearErrors } = useFormContext();
  const { defaults } = useAutomationDefaults();
  const t = useTranslations('Automations.CommentReplies');

  const onIsReplyCommentEnabled = (isActive: boolean) => {
    setValue('isReplyCommentEnabled', isActive);

    if (isActive) {
      setValue(
        'commentTexts',
        defaults?.commentTexts?.length
          ? defaults.commentTexts
          : ['به دایرکت شما ارسال شد ✅', 'دایرکتتون رو چک کنید لطفا 🙏', 'براتون ارسال شد ❤️'],
      );

      // Clear any existing errors for commentTexts fields
      clearErrors('commentTexts');

      return;
    }

    setValue('commentTexts', null);
  };

  const onAddComment = () => {
    setValue('commentTexts', [...watch('commentTexts'), '']);
  };

  const onDelete = (index: number) => {
    const comments = watch('commentTexts');
    comments.splice(index, 1);
    setValue('commentTexts', comments);
  };

  if (!watch('isComment')) {
    return null;
  }

  return (
    <>
      <SeperateLine />
      <FormField
        control={control}
        name="isReplyCommentEnabled"
        render={({ field }) => (
          <FormItem>
            <div className="relative flex items-center gap-x-2">
              <HelpMeDialog
                helpId="automation_comment_replies"
                title={t('Help.title')}
                description={t('Help.description')}
                videoSrc={WizardVideoLinks.Automations.Hints.CommentReplies.video}
                position="left"
              />
              <FormControl>
                <Switch
                  type="button"
                  checked={field.value}
                  onCheckedChange={onIsReplyCommentEnabled}
                />
              </FormControl>
              <FormLabel>{t('is_enabled.label')}</FormLabel>
            </div>
            <FormMessage />

            {field.value && (
              <>
                <FormDescription className="text-[13px]">
                  {t('is_enabled.description')}
                </FormDescription>

                <div className="mt-1 space-y-2.5">
                  {watch('commentTexts').map((commentText: string, index: number) => (
                    <FormField
                      key={index}
                      control={control}
                      name={`commentTexts.${index}`}
                      render={({ field, fieldState: { error } }) => (
                        <FormItem>
                          <div className="flex items-center justify-center gap-1.5">
                            <FormControl>
                              <Input {...field} value={field.value ?? ''}></Input>
                            </FormControl>

                            {index > 2 && (
                              <Button
                                onClick={() => onDelete(index)}
                                variant="link"
                                size="icon"
                                type="button"
                              >
                                <TrashSimpleIcon className="text-destructive" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="flex flex-col items-start">
                    <Button
                      variant="ghost"
                      type="button"
                      className="text-blue-600"
                      onClick={onAddComment}
                      disabled={watch('commentTexts').length >= 10}
                    >
                      <PlusCircleIcon />
                      {t('add_comment')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </FormItem>
        )}
      />
      <SeperateLine />
    </>
  );
};
