'use client';

import api, { setAccessToken } from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { isSafeInternalPath } from '@/utils/safeInternalPath';
import { cn } from '@/lib/utils';

import { BuildingsIcon } from '@phosphor-icons/react/dist/csr/Buildings';
import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/csr/ChatCircle';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { CircleIcon } from '@phosphor-icons/react/dist/csr/Circle';
import { HandshakeIcon } from '@phosphor-icons/react/dist/csr/Handshake';

// Shared read-out for one invitation's details — used by both the single
// (non-clickable) confirmation card and each option in the multi-invite list.
function InvitationDetails({ inv }: { inv: Invitation }) {
  const t = useTranslations('Auth.Invitations');
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <BuildingsIcon size={18} weight="duotone" className="text-primary shrink-0" />
        <span className="truncate font-medium">{inv.workspace?.name ?? '—'}</span>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <UserCircleIcon size={16} className="shrink-0" />
        <span className="truncate">
          {t('invited_by')} {inv.inviter?.firstname ?? ''} {inv.inviter?.lastname ?? ''}
        </span>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <ShieldCheckIcon size={16} className="shrink-0" />
        <span>{t('permissions_count', { count: inv.permissions?.length ?? 0 })}</span>
      </div>
      {inv.message ? (
        <div className="text-muted-foreground flex items-start gap-2 pt-1 text-xs">
          <ChatCircleIcon size={16} className="mt-0.5 shrink-0" />
          <span>
            <span className="text-foreground/80">{t('message_label')}: </span>
            {inv.message}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function OnboardingInvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth.Invitations');
  const t_ec = useTranslations('ERROR_CODES');
  const { mutate: mutateUser, isOnboarding } = useUser();
  const { mutate: globalMutate } = useSWRConfig();

  // returnTo is set by AuthProvider when routing a connect-flow (State B) user here
  // so that Skip sends them back to /connect rather than /auth/onboarding. It comes
  // from the URL query string, so only accept a same-origin relative path
  // (see isSafeInternalPath) — otherwise a crafted link could redirect the
  // user off-site.
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = isSafeInternalPath(rawReturnTo)
    ? rawReturnTo
    : isOnboarding
      ? '/auth/onboarding'
      : '/connect';

  const { invitations, isLoading } = useInvitations();

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

  const isSingle = invitations.length === 1;

  // With exactly one invitation there's nothing to pick — auto-select it so the
  // picker reads as a confirmation to accept/skip, not a choice the user has to make.
  useEffect(() => {
    if (isSingle) {
      form.setValue('invitationId', invitations[0].id, { shouldValidate: true });
    }
  }, [isSingle, invitations, form]);

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
        <div className="bg-primary/10 mb-3 flex size-12 items-center justify-center rounded-full">
          <HandshakeIcon size={26} weight="duotone" className="text-primary" />
        </div>
        <h1 className="text-primary mb-1 text-lg font-semibold">
          {isSingle ? t('title_single') : t('title')}
        </h1>
        <p className="text-muted-foreground mb-5 text-center text-sm">
          {isSingle
            ? t('description_single', { workspace: invitations[0].workspace?.name ?? '' })
            : t('description')}
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
            <FormField
              control={form.control}
              name="invitationId"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {isSingle ? (
                      // A single invitation is a confirmation, not a decision — no
                      // radio, no hover/click affordance, just the details plus a
                      // checkmark showing it's already selected for the form.
                      <div className="border-primary/40 bg-primary/5 flex items-start gap-3 rounded-lg border p-3.5">
                        <InvitationDetails inv={invitations[0]} />
                        <CheckCircleIcon
                          size={20}
                          weight="fill"
                          className="text-primary mt-0.5 shrink-0"
                        />
                      </div>
                    ) : (
                      invitations.map((inv) => {
                        const checked = field.value === inv.id;
                        return (
                          <label
                            key={inv.id}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition',
                              checked
                                ? 'border-primary bg-primary/5'
                                : 'border-muted hover:border-primary/40',
                            )}
                          >
                            <input
                              type="radio"
                              name="invitationId"
                              value={inv.id}
                              checked={checked}
                              onChange={() => field.onChange(inv.id)}
                              className="sr-only"
                            />
                            <InvitationDetails inv={inv} />
                            {checked ? (
                              <CheckCircleIcon
                                size={20}
                                weight="fill"
                                className="text-primary mt-0.5 shrink-0"
                              />
                            ) : (
                              <CircleIcon
                                size={20}
                                className="text-muted-foreground/40 mt-0.5 shrink-0"
                              />
                            )}
                          </label>
                        );
                      })
                    )}
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
