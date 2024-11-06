"use client";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form
} from "@/components/ui/form";

import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/loading-button";

import LoadingSpinner from "@/components/ui/loadingSpinner";

import JustFollowers from "./form/justFollowers";
import Trigger from "./form/trigger";
import Conditions from "./form/conditions";
import Contents from "./form/contents";
import Cta from "./form/cta";
import Catalogue from "./form/catalogue";
import GetUserData from "./form/getUserData";
import LikeDirect from "./form/likeDirect";
import Questions from "./form/questions";
import ContentCycleTitle from "./form/title";

export type ContentType = {
  id: string;
  message?: string;
  postId?: string;
  consent?: string;
};

export type ConditionType = {
  id?: string;
  type: string;
  value: string;
};

export const CONTENTCYCLE_EVENTS = {
  SelectPost: "selectPost",
};

export type SelectPostEventPayload = {
  postId: string;
};

type ContentCycleProps = {
  id?: string;
};

export const contentCycleFormSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  conditions: z
    .array(
      z.object({
        type: z.string().min(1, "نوع شرط الزامی است"),
        value: z.string().min(1, "مقدار شرط الزامی است"),
        id: z.string(),
        conditionId: z.string().optional().nullable(),
      })
    )
    .min(1, "حداقل یک شرط الزامی است"),
  questions: z.array(
    z.object({
      text: z.string(),
      id: z.string().optional().nullable(),
      _xid: z.string().optional().nullable(),
    })
  ),
  contents: z.array(
    z.object({
      text: z.string().min(1, "پیام الزامی است"),
      instagramPost: z.object({
        mediaUrl: z.string().optional().nullable(),
        mediaId: z.string().min(1, "انتخاب پست الزامی است"),
      }),
      id: z.string().optional().nullable(),
      consentText: z.string().min(1, "پیام کسب اجازه الزامی است"),
      _xid: z.string().optional().nullable(),
    })
  ),
  products: z.array(
    z.object({
      id: z.string().optional().nullable(),
      images: z
        .array(
          z.object({
            url: z.string().optional().nullable(),
            id: z.number().optional().nullable(),
          })
        )
        .optional()
        .nullable(),
      _xid: z.string().optional().nullable(),
    })
  ),
  isProductsEnabled: z.boolean().nullable().optional(),
  isDirect: z.boolean(),
  isComment: z.boolean(),
  justFollowers: z.boolean(),
  likeDirect: z.boolean(),
  followMessage: z.string().optional().nullable(),
  followCheckMessage: z.string().optional().nullable(),
  cta: z.string().min(1, "متن مرحله پایانی اجباری است"),
  commentStartText: z.string().optional().nullable(),
  getUserData: z
    .object({
      type: z.enum(["email", "mobile"]).optional().nullable(),
      text: z.string().optional().nullable(),
      enabled: z.boolean(),
    })
    .optional(),
});

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export default function ContentCycle({ id }: ContentCycleProps) {
  const [isLoading, setIsLoading] = useState<boolean>(id ? true : false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      title: "",
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      questions: [],
      contents: [],
      products: [],
      isProductsEnabled: false,
      getUserData: {
        enabled: false,
        text: "",
        type: "email",
      },
      isDirect: true,
      isComment: false,
      justFollowers: false,
      followCheckMessage: "",
      followMessage: "",
      likeDirect: false,
      cta: "",
      commentStartText: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const fetchData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/${id}`,
        {
          credentials: "include",
          method: "GET",
        }
      );

      if (!response.ok) {
        console.error("Error in fetching contentCycle data", response.json());

        toast({
          title: "خطا",
          description: "مشکلی پیش آمده است",
          variant: "destructive",
        });
        router.push("/console/actions/content-cycle");
        return;
      }

      const contentCycle = await response.json();
      form.reset({
        ...contentCycle,
        ...(contentCycle.products?.length > 0 && { isProductsEnabled: true }),
      });
    };

    fetchData().finally(() => setIsLoading(false));
  }, [id]);

  const onSubmit = async (values: z.infer<typeof contentCycleFormSchema>) => {
    // Validate Optionals
    let haveError: boolean = false;
    if (!values.isComment && !values.isDirect) {
      form.setError("isDirect", {
        message: "باید حداقل یکی از حالت‌های کامنت و دایرکت روشن باشد",
      });
      form.setFocus("isDirect");
      haveError = true;
    }

    if (values.isComment && !values.commentStartText) {
      form.setError("commentStartText", {
        message: "در حالت کامنت، پیام درخواست شروع ضروری است",
      });
      form.setFocus("commentStartText");
      haveError = true;
    }

    if (values.justFollowers) {
      if (!values.followMessage) {
        form.setError("followMessage", {
          message: "متن درخواست فالو در این حالت اجباری است",
        });
        form.setFocus("followMessage");
        haveError = true;
      }
      if (!values.followCheckMessage) {
        form.setError("followCheckMessage", {
          message: "متن دکمه بررسی مجدد در این حالت اجباری است",
        });
        form.setFocus("followCheckMessage");
        haveError = true;
      }
    }

    const productsIds = values.products.map((p) => p.id);

    if (haveError) {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle${
        id ? `/${id}` : ""
      }`,
      {
        method: id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Delete Empty values
        body: JSON.stringify({
          // ..._.omitBy(values, (value: any) =>
          //   typeof value === "boolean" ? false : Array.isArray(value) ? false : _.isEmpty(value)
          // ),
          ...values,
          ...(values.isProductsEnabled && { productsIds }),
        }),
        credentials: "include",
      }
    );

    if (!result.ok) {
      toast({
        title: "خطایی رخ داد",
        description: "لطفا مجددا امتحان کنید",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({ title: "با موفقیت ساخته شد" });
    router.push("/console/actions/content-cycle");
    setIsSubmitting(false);
  };

  useEffect(() => {
    console.log(form.getValues());
    console.log(form.formState.errors);
  }, [form.watch()]);

  return (
    <div className="min-h-screen w-full">
      {isLoading ? (
        <div className="min-h-screen w-full flex justify-center items-center">
          <LoadingSpinner className="h-20 w-20 text-gray-500" />
        </div>
      ) : (
        <div className="w-full min-h-[91.5vh]  bg-white rounded-2xl  mb-[10rem]">
          <h1 className="text-2xl font-bold px-6 py-8 border-b">
            محتوای انتخابی
          </h1>

          {/* Form wrapper */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-8 py-6 text-lg h-full space-y-8"
            >

              <ContentCycleTitle control={form.control} />

              <Trigger control={form.control} getValues={form.getValues} />

              <JustFollowers
                control={form.control}
                getValues={form.getValues}
              />

              <LikeDirect control={form.control} />

              <Conditions
                control={form.control}
                getValues={form.getValues}
                formState={form.formState}
              />

              <Questions control={form.control} />

              <Contents
                control={form.control}
                getValues={form.getValues}
                formState={form.formState}
              />

              <Cta control={form.control} />

              <Catalogue
                control={form.control}
                formState={form.formState}
                getValues={form.getValues}
              />

              <GetUserData control={form.control} />

              {/* Submit button */}
              <LoadingButton isLoading={isSubmitting}>ایجاد</LoadingButton>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
