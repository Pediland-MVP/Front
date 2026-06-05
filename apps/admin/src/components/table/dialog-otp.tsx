"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckIcon, CopyIcon, KeyIcon, LogInIcon, LockKeyholeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MOBILE_REGEX } from "@/lib/regex";
import api from "@/hooks/swr/api-client";
import { AxiosError } from "axios";

const exportSchema = z.object({
  mobile: z.string().regex(MOBILE_REGEX),
});

type OtpByMobileValues = z.infer<typeof exportSchema>;

interface OtpByMobileProps {
  trigger?: React.ReactNode;
}

interface OtpResult {
  otp: string | null;
  resetPasswordOtp: string | null;
}

function CopyableOtp({
  label,
  code,
  icon,
}: {
  label: string;
  code: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-base font-semibold tracking-widest text-foreground">
          {code}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function OtpDialog({ trigger }: OtpByMobileProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpResult, setOtpResult] = useState<OtpResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();

  const form = useForm<OtpByMobileValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: { mobile: "" },
  });

  const onSubmit = async (data: OtpByMobileValues) => {
    setErrorMessage(undefined);
    setOtpResult(null);
    setIsSubmitting(true);
    try {
      const response = await api.get(`/users/otpByMobile/${data.mobile}`);
      const { otp, resetPasswordOtp } = response.data.data ?? {};
      setOtpResult({ otp: otp ?? null, resetPasswordOtp: resetPasswordOtp ?? null });
    } catch (e) {
      if (e instanceof AxiosError) {
        switch (e.response?.data?.code) {
          case "OTP_NOT_GENERATED":
            setErrorMessage("کاربر هنوز درخواست OTP نداده است");
            break;
          case "USER_NOTFOUND":
            setErrorMessage("کاربری با این شماره موبایل وجود ندارد");
            break;
          default:
            setErrorMessage("خطایی پیش آمده");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      form.reset();
      setOtpResult(null);
      setErrorMessage(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" color="primary">
            <KeyIcon />
            رمز یکبار مصرف
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>دریافت رمز یکبار مصرف</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره موبایل</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="09212469690" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            {otpResult && (otpResult.otp || otpResult.resetPasswordOtp) && (
              <div className="space-y-2">
                {otpResult.otp && (
                  <CopyableOtp
                    label="ورود / احراز هویت"
                    code={otpResult.otp}
                    icon={<LogInIcon className="h-4 w-4 shrink-0" />}
                  />
                )}
                {otpResult.resetPasswordOtp && (
                  <CopyableOtp
                    label="بازیابی رمز عبور"
                    code={otpResult.resetPasswordOtp}
                    icon={<LockKeyholeIcon className="h-4 w-4 shrink-0" />}
                  />
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                بستن
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "در حال دریافت..." : "دریافت کد"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
