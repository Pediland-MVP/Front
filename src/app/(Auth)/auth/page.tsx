"use client";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from "@/components";
import { LoadingLogo } from "@/components/Global/LoadingLogo";
import { MoveLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function AuthPage() {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      mobile: "",
    },
  });

  const onSubmit = (data: { mobile: string }) => {
    console.log("onSubmit", data);
  };

  return (
    <>
      <LoadingLogo delay={3000} />

      <div className="flex w-full flex-1 flex-col gap-10">
        <div className="flex flex-1 items-end justify-center">
          <h1 className="text-gradient text-2xl font-extrabold">بـفـروش</h1>
        </div>

        <div className="space-y-5">
          <div className="text-center text-[15px] font-medium">
            برای ورود یا ثبت نام
            <br />
            <span className="text-primary font-bold">شماره همراه</span> خود را
            وارد کنید.
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-center tracking-widest"
                        maxLength={11}
                        placeholder="شـمـاره هـمـراه"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                تایید و ادامه
              </Button>

              <p className="text-muted-foreground text-center text-[13px]">
                قوانین و مقررات استفاده از خدمات بفروش
              </p>
            </form>
          </Form>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <Button
            variant="link"
            type="button"
            className="text-muted-foreground"
            onClick={() => router.back()}
          >
            بازگشت
            <MoveLeftIcon />
          </Button>
        </div>
      </div>
    </>
  );
}
