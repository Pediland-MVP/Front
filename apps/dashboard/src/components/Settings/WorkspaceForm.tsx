'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/hooks/swr/api-client';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { usePermissions } from '@/hooks/usePermissions';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

export function WorkspaceForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations('Settings.Workspace');
  const { workspaceId } = usePermissions();
  const { workspaces, isLoading: workspacesIsLoading, mutate } = useWorkspaces();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === workspaceId);

  const formSchema = z.object({
    name: z.string().min(3).max(50),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (activeWorkspace) {
      form.reset({
        name: activeWorkspace.name,
      });
    }
  }, [activeWorkspace, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!workspaceId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/workspaces/${workspaceId}`, { name: data.name });
      toast.success(t('success'));
      mutate(); // Refresh workspaces
      onSuccess?.();
    } catch (e) {
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (workspacesIsLoading) return <LoaderSpin />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-1/2">
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('name')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <ButtonLoading isLoading={isSubmitting} type="submit" className="mt-4 w-full md:w-auto">
          {t('save')}
        </ButtonLoading>
      </form>
    </Form>
  );
}
