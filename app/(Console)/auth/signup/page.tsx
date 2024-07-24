"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import AuthHeader from "../components/auth.header";
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
                  onClick={() => router.push("/auth/login")}
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
    <main className="_signup pt-14 sm:pt-0 h-full relative">
      <AuthHeader />
      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2">
            <GoogleLogo size={32} />
            <h1 className="text-xl font-semibold">ثبت نام کاربر جدید</h1>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            حساب کاربری دارید؟{" "}
            <Link className="text-black" href="/auth/login">
              وارد شوید
            </Link>
          </p>
          <div className="_form">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className=" space-y-2"
              >
                <Input
                  {...form.register("firstname")}
                  placeholder="نام"
                  className="col-span-4"
                />
                <Input
                  {...form.register("lastname")}
                  placeholder="نام خانوادگی"
                  className="col-span-4"
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="شماره همراه"
                          className="col-span-4"
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
                    <FormItem>
                      <FormControl>
                        <Input
                          className="col-span-4"
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
                  className="col-span-4"
                />
                <Button
                  type="submit"
                  className="w-full text-white"
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
            <TextDivider size="lg">
              <p>یا با گوگل وارد شوید</p>
            </TextDivider>
            <Button
              onClick={signUpWithGoogle}
              className="w-full"
              color="primary"
              size="lg"
              variant={"outline"}
              disabled={isLoading}
            >
              ورود با اکانت گوگل
              {loginWith === "google" && isLoading ? (
                <LoadingSpinner className="mr-1" size={20} />
              ) : (
                <GoogleLogo weight="bold" size={20} className="mr-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
