'use client';

import api, { setAccessToken } from '@/hooks/swr/api-client';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { resolvePostAuthDestination } from '@/utils/resolvePostAuthDestination';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { CounterDown } from '@/components/ui-custom/CounterDown';
import { TelegramOtpInlineLink } from '@/components/ui-custom/TelegramOtpInlineLink';
import { CircleNotchIcon } from '@phosphor-icons/react/dist/csr/CircleNotch';
import { NumpadIcon } from '@phosphor-icons/react/dist/csr/Numpad';
import { RefreshCwIcon } from 'lucide-react';
import SupportButton from '../supportButton';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function OtpPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth');
  const t_err = useTranslations('Auth.Errors');
  const t_ec = useTranslations('ERROR_CODES');

  const [mobile, setMobile] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const storedMobile = sessionStorage.getItem('prelogin_mobile');

    if (!storedMobile) {
      router.replace('/auth');
      return;
    }

    setMobile(storedMobile);
    setChecked(true);

    return () => sessionStorage.removeItem('prelogin_mobile');
  }, [router]);

  const formSchema = z.object({
    otp: z.string().length(5, t_err('otp_length')),
    mobile: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
      mobile: '',
    },
  });

  useEffect(() => {
    if (mobile) form.setValue('mobile', mobile);
  }, [mobile, form]);

  const otpCompleted = () => form.handleSubmit(onSubmit)();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/mobile/oneTime/signIn', values);
      setAccessToken(res?.data?.data?.accessToken);
      const me = await api.get('/users/me');
      await mutate(mutateIncludeStringKey('/users/me'));
      sessionStorage.removeItem('prelogin_mobile');

      router.push(await resolvePostAuthDestination(me?.data?.data?.status));
    } catch (error) {
      console.error('❌ API Error:', error.response?.data);
      toast.error(t_ec(error.response?.data?.code));
      setIsLoading(false);
    }
  };

  const resendHandler = async () => {
    setIsResendLoading(true);

    try {
      await api.get(`${API_URL}/auth/prelogin`, { params: { mobile } });
      setShowResend(false);
      toast.success(t('Toasts.code_resent'));
    } catch (error) {
      if (error?.response?.data?.statusCode === 429) toast.error(t_ec('TOO_MANY_REQUESTS'));
      else toast.error(error.response?.data?.message || 'Error');
    } finally {
      setIsResendLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center px-10 sm:max-w-sm">
        <h1 className="flex items-center justify-center gap-2 text-lg font-bold">
          <NumpadIcon size={28} weight="duotone" />
          {t('title_login_otp')}
        </h1>
      </div>

      <div className="space-y-3 px-10 sm:max-w-sm">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t('code_sent_to_mobile')}</div>
          <div className="flex items-center justify-center">
            <span className="text-primary text-base tracking-widest">{mobile}</span>
            <Button
              variant="link"
              type="button"
              size="sm"
              className="text-muted-foreground text-[13px]"
              onClick={() => {
                router.push('/auth');
              }}
            >
              {t('change_number')}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP
                      maxLength={5}
                      {...field}
                      pattern={REGEXP_ONLY_DIGITS}
                      onComplete={otpCompleted}
                      onInput={onInputP2EHandler}
                      autoFocus
                    >
                      <InputOTPGroup className={locale === 'fa' && 'flex-row-reverse'}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />

            <div className="text-muted-foreground flex items-center gap-2 text-[15px]">
              {!showResend ? (
                <CounterDown time={120} onEnd={() => setShowResend(true)} />
              ) : (
                <Button
                  variant="link"
                  type="button"
                  size="sm"
                  className="text-muted-foreground h-auto text-[13px] font-normal"
                  onClick={resendHandler}
                  disabled={isResendLoading}
                >
                  {isResendLoading ? (
                    <CircleNotchIcon className="animate-spin" size={16} />
                  ) : (
                    <>
                      <RefreshCwIcon className="size-3.5" />
                      {t('resend_code')}
                    </>
                  )}
                </Button>
              )}
            </div>

            <ButtonLoading
              isLoading={isLoading}
              disabled={isLoading || !form.watch('otp') || !form.formState.isValid}
              className="w-full"
              onClick={form.handleSubmit(onSubmit)}
            >
              {t('confirm_and_continue')}
            </ButtonLoading>

            <TelegramOtpInlineLink phone={mobile || undefined} />
          </form>
        </Form>
      </div>
      <SupportButton type="external" />
      <div className="flex flex-1 flex-col items-center justify-center"></div>
    </div>
  );
}
