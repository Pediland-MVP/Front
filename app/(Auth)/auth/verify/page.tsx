"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem, FormMessage
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import ButtonLoading from "@/components/ui/button-loading";

export default function VerifyOTP() {
  const t = useTranslations('Verify');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formSchema = z.object({
    otp: z.string().length(6, t('errors.otpLength')),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const firstSlotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstSlotRef.current) {
      firstSlotRef.current.focus();
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/verifyOtp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(values),
        }
      );

      if (!res.ok) {
        if (res.status === 429) {
          toast({
            title: t('toasts.tryAgainLater'),
            variant: "destructive",
          });
          return;
        }

        if (res.status === 409) {
          toast({
            title: t('toasts.alreadyVerified'),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t('toasts.error'),
          description: t('toasts.invalidOTP'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('toasts.loginSuccess'),
        description: t('toasts.welcomeMessage'),
      });
      router.push("/console");
    } catch (error) {
      console.error(error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.invalidOTP'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendHandler = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/resendOtp`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (!res.ok) {
      if (res.status === 429) {
        toast({
          title: t('toasts.waitTwoMinutes'),
          variant: "destructive",
        });
        return;
      }

      if (res.status === 409) {
        toast({
          title: t('toasts.alreadyVerified'),
          variant: "destructive",
        });
      }
    }
  };

  const otpCompleted = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <main className="h-full">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center w-full sm:w-1/3 mx-auto">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full flex flex-col justify-center items-center"
              >
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="my-6 flex flex-col justify-center items-center">
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          {...field}
                          pattern={REGEXP_ONLY_DIGITS}
                          ref={firstSlotRef}
                          onComplete={otpCompleted}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormDescription>
                        {t('otpDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ButtonLoading
                  isLoading={isLoading}
                  type="submit"
                  className="col-span-4 text-white w-9/12"
                  color="success"
                  disabled={isLoading}
                  size={"lg"}
                >
                  {t('verifyButton')}
                </ButtonLoading>
              </form>
            </Form>
            <div className="mt-4">
              <p
                className="text-sm text-gray-400 hover:text-gray-700 font-light duration-300 cursor-pointer"
                onClick={resendHandler}
              >
                {t('resendCode')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

