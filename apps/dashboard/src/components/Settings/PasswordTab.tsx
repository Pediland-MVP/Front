'use client';

import api from '@/hooks/swr/api-client';
import useUser from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { CounterDown } from '@/components/ui-custom/CounterDown';
import { InputPassword } from '@/components/ui-custom/InputPassword';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { CircleNotchIcon } from '@phosphor-icons/react/dist/csr/CircleNotch';
import { LockIcon } from '@phosphor-icons/react/dist/csr/Lock';
import { LockOpenIcon } from '@phosphor-icons/react/dist/csr/LockOpen';
import { RefreshCwIcon } from 'lucide-react';
import { REGEX_PASSWORD } from '@/utils/regex';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

const formSchema = z
  .object({
    password: z
      .string()
      .regex(REGEX_PASSWORD, {
        message: 'رمز عبور باید ۸ تا ۶۴ کاراکتر بوده و حداقل شامل یک حرف و یک عدد باشد.',
      })
      .min(1, 'رمز عبور الزامی است')
      .min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
    confirmPassword: z.string().min(1, 'تأیید رمز عبور الزامی است'),
    otp: z.string().min(1, 'کد فعالسازی الزامی است').length(5, 'کد باید ۵ رقم باشد'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'رمز عبور و تأیید آن یکسان نیستند',
    path: ['confirmPassword'],
  });

export function PasswordTab() {
  const t = useTranslations('Settings.Password');
  const t_ec = useTranslations('ERROR_CODES');

  const [showForm, setShowForm] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading, mutate: mutateUser } = useUser();
  const havePassword = user?.havePassword;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
      otp: '',
    },
  });
  const { control } = form;

  // Watch form values for validation
  const watchedValues = useWatch({
    control,
    name: ['password', 'confirmPassword', 'otp'],
  });

  const [password, confirmPassword, otp] = watchedValues;

  // Individual validation checks
  const validations = {
    passwordLength: password && password.length >= 6,
    confirmPasswordLength: confirmPassword && confirmPassword.length >= 6,
    passwordsMatch: password && confirmPassword && password === confirmPassword,
    otpLength: otp && otp.length === 5,
    allFieldsFilled: password && confirmPassword && otp,
  };

  // Validation logic for button state
  const isFormValid =
    validations.passwordLength &&
    validations.confirmPasswordLength &&
    validations.passwordsMatch &&
    validations.otpLength &&
    validations.allFieldsFilled;

  // Blur handlers - validation only when leaving field
  const handlePasswordBlur = () => {
    form.trigger('password');
  };

  const handleConfirmPasswordBlur = () => {
    form.trigger('confirmPassword');
  };

  const handleOtpBlur = () => {
    form.trigger('otp');
  };

  const requestHandler = async () => {
    setIsRequesting(true);

    try {
      const otpRequest = await api.patch(`${API_URL}/auth/mobile/sendResetPasswordCode`, {
        mobile: user?.mobile,
      });
      toast.success(t('otp_sent'));
      setShowResend(false);
      setShowForm(true);
    } catch (error) {
      if (error?.response?.data?.statusCode === 429) toast.error(t_ec('TOO_MANY_REQUESTS'));
      else toast.error(t_ec(error?.response?.data?.code) || error.response?.data?.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const submitHandler = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const submitData = {
      mobile: user?.mobile,
      otp: otp,
      password: password,
    };

    try {
      const response = await api.patch(`${API_URL}/auth/mobile/resetPassword`, submitData);
      toast.success(t('success'));
      setShowForm(false);
      await mutateUser();
    } catch (error) {
      toast.error(t_ec(error.response?.data?.code) || error.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5">
        <h2 className="text-primary mb-1 font-semibold">{t('title')}</h2>
        <div className="text-muted-foreground inline-flex flex-wrap items-center gap-1 text-sm">
          {havePassword ? (
            <LockIcon size={20} weight="duotone" />
          ) : (
            <LockOpenIcon size={20} weight="duotone" />
          )}
          <span>{t('description')}</span>
          <span
            className={cn('font-semibold', havePassword ? 'text-green-600' : 'text-destructive')}
          >
            {havePassword ? t('is_active') : t('is_not_active')}
          </span>
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <LoaderSpin />
        ) : showForm ? (
          <div className="w-full md:w-1/2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رمز عبور</FormLabel>
                      <FormControl>
                        <InputPassword {...field} onBlur={handlePasswordBlur} autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأیید رمز عبور</FormLabel>
                      <FormControl>
                        <InputPassword {...field} onBlur={handleConfirmPasswordBlur} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کد فعالسازی</FormLabel>
                      <FormControl>
                        <InputOTP
                          maxLength={5}
                          {...field}
                          pattern={REGEXP_ONLY_DIGITS}
                          onBlur={handleOtpBlur}
                          dir="rtl"
                        >
                          <InputOTPGroup className="flex w-full flex-row-reverse justify-between gap-2.5">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <InputOTPSlot className="w-full" key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-muted-foreground flex items-center justify-center gap-2 text-[15px]">
                  {!showResend ? (
                    <CounterDown time={120} onEnd={() => setShowResend(true)} />
                  ) : (
                    <Button
                      variant="link"
                      type="button"
                      size="sm"
                      className="text-muted-foreground h-auto text-[13px] font-normal"
                      onClick={requestHandler}
                      disabled={isRequesting}
                    >
                      {isRequesting ? (
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

                <div className="flex w-full gap-2">
                  <ButtonLoading
                    isLoading={isSubmitting}
                    type="submit"
                    className="flex-1"
                    disabled={!isFormValid || isRequesting}
                  >
                    {havePassword ? t('change_password') : t('create_password')}
                  </ButtonLoading>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <div className="w-full md:w-1/2">
            <ButtonLoading isLoading={isRequesting} onClick={requestHandler} className="w-full">
              {havePassword ? t('change_password') : t('create_password')}
            </ButtonLoading>
          </div>
        )}
      </div>
    </div>
  );
}
