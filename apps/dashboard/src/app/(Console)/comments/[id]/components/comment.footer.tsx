'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Form, FormField } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import api from '@/hooks/swr/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaperPlaneRightIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneRight';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { z } from 'zod';
import { EmojiPicker } from '../../../directs/components/emojiPicker';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface RedesignedCommentFooterProps {
  commentId: string;
  addReply: (replyData: any) => void;
}

export default function RedesignedCommentFooter({
  commentId,
  addReply,
}: RedesignedCommentFooterProps) {
  const t = useTranslations('Comments.Footer');

  const formSchema = z.object({
    text: z.string().min(1, `${t('errors.text')}`),
  });

  type FormData = z.infer<typeof formSchema>;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post<{ message: string[] }>(
        `${API_URL}/comments/reply/${commentId}`,
        data,
        {
          withCredentials: true,
        },
      );

      addReply(response.data);
      await mutate((key) => typeof key === 'string' && key.includes(`comments/${commentId}`));
      toast.success(t('success'));
      form.reset();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error(t('error'));
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    }
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      const currentText = form.getValues('text');
      form.setValue('text', currentText + '\n');
    }
  };

  return (
    <CardFooter className="fixed right-0 bottom-0 left-0 w-full border-t bg-white px-2 pt-2 pb-2 lg:static lg:p-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center">
          <EmojiPicker
            onChange={(value) => {
              const currentText = form.getValues('text');
              form.setValue('text', currentText + value);
              inputRef.current?.focus();
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={form.formState.isSubmitting}
          >
            <PaperPlaneRightIcon size={20} className="text-muted-foreground" />
          </Button>
          <AnimatePresence initial={false}>
            <motion.div
              key="input"
              className="relative mx-2 w-full"
              layout
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{
                opacity: { duration: 0.05 },
                layout: {
                  type: 'spring',
                  bounce: 0.15,
                },
              }}
            >
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <Textarea
                    {...field}
                    ref={inputRef}
                    placeholder={t('placeholder')}
                    className="min-h-[60px] w-full resize-none"
                    onKeyDown={handleKeyPress}
                    autoComplete="off"
                  />
                )}
              />
            </motion.div>
          </AnimatePresence>
        </form>
      </Form>
    </CardFooter>
  );
}
