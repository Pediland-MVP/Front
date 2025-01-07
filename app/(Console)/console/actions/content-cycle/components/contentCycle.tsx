"use client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import JustFollowers from "./form/justFollowers";
import Trigger from "./form/trigger";
import Conditions from "./form/conditions";
import Contents from "./form/contents/contents";
import Cta from "./form/cta";
import Catalogue from "./form/catalogue";
import GetUserData from "./form/getUserData";
import LikeDirect from "./form/likeDirect";
import ContentCycleTitle from "./form/title";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
// Just UI Imports Below
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import LoadingButton from "@/components/ui/button-loading";
import { Card } from "@/components/theme/ui/card";
import logger from "@/app/utils/logger";
import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { ConversationsContextType } from "../../../inbox/layout";

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

export const contentCycleFormSchema = z
  .object({
    title: z.string().min(1, "لطفا عنوان اتوماسیون رو مشخص کنید."),
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
    contents: z.array(
      z.object({
        type: z.nativeEnum(ContentCycleContentTypesEnum),
        text: z
          .string()
          .min(1, "پیام الزامی است")
          .optional()
          .nullable()
          .transform((data) => data || undefined),
        instagramPost: z
          .object({
            mediaUrl: z.string().optional().nullable(),
            mediaId: z.string().min(1, "انتخاب پست الزامی است"),
          })
          .optional()
          .nullable(),
        file: z
          .object({
            id: z.number(),
            url: z.string().url().optional().nullable(),
            name: z.string().optional().nullable(),
            mimeType: z.string().optional().nullable(),
          })
          .optional()
          .nullable(),
        id: z.string().optional().nullable(),
        haveConsent: z
          .boolean()
          .optional()
          .nullable()
          .transform((data) => data || false),
        haveInstagramPost: z
          .boolean()
          .optional()
          .nullable()
          .transform((data) => undefined),
        consentText: z
          .string()
          .optional()
          .nullable()
          .transform((data) => data || undefined),
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
    isContentsEnabled: z
      .boolean()
      .nullable()
      .optional()
      .transform((data) => data || false),
    isDirect: z.boolean(),
    isComment: z.boolean(),
    commentStartText: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    commentStartTitle: z.string().optional().nullable(),
    justFollowers: z.boolean(),
    likeDirect: z.boolean(),
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),
    cta: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    haveCta: z
      .boolean()
      .optional()
      .nullable()
      .transform((data) => data || false),
    getUserData: z
      .object({
        type: z.enum(["email", "mobile"]).optional().nullable(),
        text: z.string().optional().nullable(),
        enabled: z.boolean(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.haveCta && !data.cta) {
      ctx.addIssue({
        path: ["cta"],
        code: "custom",
      });
    }

    data.contents.forEach((content, index) => {
      if (content.type === ContentCycleContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ["contents", index, "text"],
          code: "custom",
        });
        return;
      }
      if (
        content.type === ContentCycleContentTypesEnum.INSTAGRAM_POST &&
        !content.instagramPost
      ) {
        ctx.addIssue({
          path: ["contents", index, "instagramPost"],
          code: "custom",
        });
        return;
      }

      // For files: video, image, voice
      ctx.addIssue({
        path: ["contents", index, "file"],
        code: "custom",
      });
    });

    if (!data.contents.length && !data.products.length && !data.cta) {
      ctx.addIssue({
        path: ["isContentsEnabled"],
        code: "custom",
        message: "at_least",
      });
      ctx.addIssue({
        path: ["isProductsEnabled"],
        code: "custom",
        message: "at_least",
      });
      ctx.addIssue({
        path: ["cta"],
        code: "custom",
        message: "at_least",
      });
    }
  });

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export default function ContentCycle({ id }: ContentCycleProps) {
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState<boolean>(id ? true : false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [],
      products: [],
      isProductsEnabled: false,
      isContentsEnabled: false,
      getUserData: {
        enabled: false,
        text: "",
        type: "email",
      },
      isDirect: true,
      isComment: false,
      justFollowers: false,
      likeDirect: false,
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

        body: JSON.stringify({
          ...values,
          ...(values.isProductsEnabled && { productsIds }),
        }),
        credentials: "include",
      }
    );

    if (!result.ok) {
      const json = await result.json();
      const errMessage = t_ec(json.code);
      if (errMessage) {
        toast({
          title: errMessage,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
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

  const t = useTranslations("Automations");

  useEffect(() => {
    logger.log(form.formState.errors);
  }, [form.formState.errors]);

  useEffect(() => {
    logger.log(form.getValues());
  }, [form.watch()]);

  return (
    <FormProvider {...form}>
      <div className="_add-automation w-full xl:w-1/2 2xl:w-1/3 h-full">
        <Card className="border-l-2 border-gray-100 px-8 py-6 h-full">
          {isLoading ? (
            <div className="min-h-screen w-full flex justify-center items-center">
              <LoadingSpinner className="h-20 w-20 text-gray-500" />
            </div>
          ) : (
            <div className="_wrap">
              {/* Form wrapper */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-3"
                >
                  <ContentCycleTitle control={form.control} />

                  <hr className="border-gray-100" />

                  <Trigger control={form.control} getValues={form.getValues} />

                  <hr className="border-gray-100" />

                  <Conditions
                    control={form.control}
                    getValues={form.getValues}
                    formState={form.formState}
                  />

                  <hr className="border-gray-100" />

                  <Contents />

                  <hr className="border-gray-100" />

                  <Catalogue />

                  <hr className="border-gray-100" />

                  <GetUserData control={form.control} />

                  <hr className="border-gray-100" />

                  <JustFollowers
                    control={form.control}
                    getValues={form.getValues}
                  />

                  <hr className="border-gray-100" />

                  <LikeDirect control={form.control} />

                  <hr className="border-gray-100" />

                  <Cta control={form.control} />

                  {/* Submit button */}
                  <LoadingButton isLoading={isSubmitting}>
                    {id ? t("update") : t("submit")}
                  </LoadingButton>
                </form>
              </Form>
            </div>
          )}
        </Card>
      </div>
    </FormProvider>
  );
}
