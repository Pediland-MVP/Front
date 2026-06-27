'use client';

import api, { fetcher } from '@/hooks/swr/api-client';
import { setAccessToken } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormMessage, Input } from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

type Invitation = {
  id: string;
  workspace: { id: string; name: string };
  inviter: { firstname: string | null; lastname: string | null };
  message: string | null;
  permissions: string[];
};

export default function OnboardingInvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.Invitations');
  const t_ec = useTranslations('ERROR_CODES');
  const { mutate: mutateUser, isOnboarding } = useUser();
  const { mutate: globalMutate } = useSWRConfig();

  // returnTo is set by AuthProvider when routing a connect-flow (State B) user here
  // so that Skip sends them back to /connect rather than /auth/onboarding.
  const returnTo = searchParams.get('returnTo') ?? (isOnboarding ? '/auth/onboarding' : '/connect');

  const { data, isLoading } = useSWR<{ data?: Invitation[] } | Invitation[]>(
    '/invitations/pending',
    fetcher,
  );

  const invitations: Invitation[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data ?? []);
  }, [data]);

  // Schema adapts to the user's lifecycle state:
  // - ONBOARDING users haven't provided their name yet → required name fields
  // - CONNECT-FLOW (State B) users already completed onboarding → names optional
  const formSchema = useMemo(
    () =>
      z.object({
        invitationId: z.string().uuid({ message: t('must_pick_one') }),
        firstname: isOnboarding
          ? z.string().min(3, t('first_name_too_short'))
          : z.string().optional(),
        lastname: isOnboarding
          ? z.string().min(3, t('last_name_too_short'))
          : z.string().optional(),
      }),
    [t, isOnboarding],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: { invitationId: '', firstname: '', lastname: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (isOnboarding) {
        // ONBOARDING path: single endpoint that atomically sets name + creates membership
        // and returns a token already scoped to the invited workspace.
        const res = await api.post('/auth/onboarding/acceptInvitation', values);
        const accessToken = res.data?.data?.accessToken ?? res.data?.accessToken;
        if (accessToken) setAccessToken(accessToken);
        // Set dismissed BEFORE invalidating SWR caches so AuthProvider doesn't
        // see the empty-pending state with dismissed=false and redirect to /connect
        // while we're still in this handler. Remaining invitations from other
        // workspaces must not re-trigger the picker after the user has already chosen.
        sessionStorage.setItem('invitePickerDismissed', '1');
        globalMutate('/invitations/pending');
        mutateUser();
        router.push('/');
      } else {
        // STATE B (connect-flow) path: user already completed onboarding.
        // Use the regular accept endpoint (no status check), then switch workspace.
        const selectedInv = invitations.find((inv) => inv.id === values.invitationId);
        if (!selectedInv) throw new Error('Invitation not found');

        await api.post(`/invitations/${values.invitationId}/accept`);

        // Switch active workspace to the one we just joined. The new access token
        // is scoped to the invited workspace so /users/me returns that workspace's data.
        const switchRes = await api.post('/auth/changeWorkspace', {
          workspaceId: selectedInv.workspace.id,
        });
        const newToken = switchRes.data?.data?.accessToken ?? switchRes.data?.accessToken;
        if (newToken) setAccessToken(newToken);
        // Set dismissed BEFORE invalidating SWR caches — same reason as onboarding path.
        sessionStorage.setItem('invitePickerDismissed', '1');
        globalMutate('/invitations/pending');
        mutateUser();
        router.push('/');
      }
    } catch (err: any) {
      console.error('acceptInvitation error', err);
      toast.error(t_ec(err.response?.data?.code) || t('accept_error'));
      setIsSubmitting(false);
    }
  };

  // Deny all pending invitations so the backend status reflects the skip (spec:
  // "whenever an invitation is skipped, its status changes to rejected").
  // Failures are silently swallowed — the skip itself must not be blocked.
  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await Promise.allSettled(invitations.map((inv) => api.post(`/invitations/${inv.id}/deny`)));
      await globalMutate('/invitations/pending');
    } finally {
      sessionStorage.setItem('invitePickerDismissed', '1');
      router.push(returnTo);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-lvh w-full items-center justify-center">
        <LoaderSpin />
      </div>
    );
  }

  if (invitations.length === 0) {
    // Defensive — AuthProvider normally prevents landing here with no invitations.
    return (
      <div className="flex h-lvh w-full flex-col items-center justify-center px-10">
        <p className="text-muted-foreground mb-4 text-sm">{t('no_invitations')}</p>
        <ButtonLoading onClick={handleSkip} isLoading={isSkipping}>
          {t('continue_without_joining')}
        </ButtonLoading>
      </div>
    );
  }

  return (
    <div className="flex h-lvh w-full flex-col items-center justify-start overflow-x-hidden px-6 pt-12">
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-start">
        <h1 className="text-primary mb-1 text-lg font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground mb-5 text-center text-sm">{t('description')}</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="invitationId"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {invitations.map((inv) => {
                      const checked = field.value === inv.id;
                      return (
                        <label
                          key={inv.id}
                          className={`flex cursor-pointer flex-col rounded-md border p-3 transition ${
                            checked ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="invitationId"
                              value={inv.id}
                              checked={checked}
                              onChange={() => field.onChange(inv.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{inv.workspace?.name ?? '—'}</div>
                              <div className="text-muted-foreground text-xs">
                                {t('invited_by')} {inv.inviter?.firstname ?? ''}{' '}
                                {inv.inviter?.lastname ?? ''}
                              </div>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {t('permissions_count', {
                                  count: inv.permissions?.length ?? 0,
                                })}
                              </div>
                              {inv.message ? (
                                <div className="mt-2 text-xs">
                                  <span className="text-muted-foreground">
                                    {t('message_label')}:{' '}
                                  </span>
                                  {inv.message}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name fields are only required during initial onboarding.
                State B (connect-flow) users already provided their name. */}
            {isOnboarding && (
              <>
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('first_name_placeholder')}
                          className="text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('last_name_placeholder')}
                          className="text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <ButtonLoading
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting || isSkipping}
            >
              {t('join_button')}
            </ButtonLoading>

            <ButtonLoading
              type="button"
              variant="link"
              onClick={handleSkip}
              isLoading={isSkipping}
              disabled={isSubmitting || isSkipping}
              className="text-muted-foreground w-full"
            >
              {t('continue_without_joining')}
            </ButtonLoading>
          </form>
        </Form>
      </div>
    </div>
  );
}
