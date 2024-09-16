"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import TextDivider from "@/components/ui/textDivider";
import { Eye, EyeSlash, GoogleLogo } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REGEX_MOBILE, REGEX_PASSWORD } from "@/app/utils/regex";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ToastAction } from "@radix-ui/react-toast";
import Link from "next/link";

export default function Signup() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<"mobile" | "google">();

  const formSchema = z.object({
    firstname: z.string({ message: "نام الزامیست" }).min(1, "نام را وارد کنید"),
    lastname: z
      .string({ message: "نام خانوادگی الزامیست" })
      .min(1, "نام خانوادگی را وارد کنید"),
    mobile: z
      .string({ message: "شماره همراه الزامیست" })
      .regex(REGEX_MOBILE, "شماره همراه نامعتبر است")
      .min(1, "شماره همراه را وارد کنید"),
    password: z
      .string({ message: "پسورد الزامیست" })
      .regex(
        REGEX_PASSWORD,
        "پسورد باید حداقل ۸ کاراکتر و شامل یک عدد و یک حرف انگلیسی بزرگ باشد"
      ),
    confirmPassword: z
      .string({ message: "تکرار پسورد الزامیست" })
      .min(1, "تکرار پسورد را وارد کنید"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      process.env.NODE_ENV === "development"
        ? {
          firstname: "Test",
          lastname: "TestUser",
          mobile: "09210246947",
          password: "123Sina@",
          confirmPassword: "123Sina@",
        }
        : undefined,
  });

  const router = useRouter();

  const onSubmit = async (values: any) => {
    setLoginWith("mobile");
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/signUp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      }
    )
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            toast({
              title: "لطفا وارد شوید",
              description: "این شماره همراه قبلا ثبت شده است",
              variant: "destructive",
              action: (
                <ToastAction
                  altText="وارد شوید"
                  onClick={() => router.push("/auth/signin")}
                >
                  {" "}
                  ورود{" "}
                </ToastAction>
              ),
            });
            return;
          }

          toast({
            title: "خطا",
            description: resJson.message,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "ثبت نام شما موفق بود",
          description: "به حساب کاربری خود خوش آمدید",
        });
        router.push("/console");
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: "خطا",
          description: "خطایی رخ داده است",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  const signUpWithGoogle = () => {
    setLoginWith("google");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`);
  };

  return (
    <main className="_signup h-full">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="_wrap flex items-center justify-center h-full">
          <div className="_content text-center w-full sm:w-1/3 mx-auto">
            <div className="_header mb-6 flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">ثبت نام کاربر جدید</h1>
              <p className="text-sm text-gray-400">حساب کاربری دارید؟ <Link className="text-gray-400 hover:text-black" href='/auth/signin'>از اینجا وارد شوید</Link></p>
            </div>
            <div className="_form">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid grid-cols-4 gap-2"
                >
                  <Input
                    {...form.register("firstname")}
                    placeholder="نام"
                    wrapperClassName="col-span-2"
                  />
                  <Input
                    {...form.register("lastname")}
                    placeholder="نام خانوادگی"
                    wrapperClassName="col-span-2"
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="شماره همراه"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
                            placeholder="رمز عبور"
                            type={isVisible ? "text" : "password"}
                            startContent={
                              <button
                                className="focus:outline-none flex justify-center items-center"
                                type="button"
                                onClick={toggleVisibility}
                              >
                                {isVisible ? (
                                  <Eye size={22} className="text-gray-400" />
                                ) : (
                                  <EyeSlash size={22} className="text-gray-400" />
                                )}
                              </button>
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Input
                    {...form.register("confirmPassword")}
                    type={isVisible ? "text" : "password"}
                    placeholder="تکرار رمز عبور"
                    wrapperClassName="col-span-4"
                  />
                  <Button
                    type="submit"
                    className="col-span-4 text-white mt-1"
                    color="success"
                    disabled={isLoading}
                  >
                    ثبت نام
                    {isLoading && loginWith === "mobile" && (
                      <LoadingSpinner className="mr-1" size={20} />
                    )}
                  </Button>
                </form>
              </Form>

              <TextDivider size="lg">یا</TextDivider>

              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-2"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === 'google' && isLoading ? <LoadingSpinner className="ml-1" size={22} /> : ""}
                  ادامه با اکانت گوگل
                </Button>
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-2"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === 'google' && isLoading ? <LoadingSpinner className="ml-1" size={22} /> : ""}
                  ادامه با اکانت فیس بوک
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
