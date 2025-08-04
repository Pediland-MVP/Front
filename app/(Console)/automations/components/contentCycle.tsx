// app/(Console)/automations/components/contentCycle.tsx
"use client";

import {
  ContentCycleContentModeEnum,
  ContentCycleContentTypesEnum,
} from "@/app/constants/contentCycleContent.enum";
import { REGEX_URL } from "@/app/utils/regex";
import api from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";
import { CommentReplies } from "./form/commentReplies";
import Conditions from "./form/conditions";
import Contents from "./form/contents/contents";
import JustFollowers from "./form/justFollowers";
import Reminder from "./form/reminder";
import Trigger from "./form/trigger";

// UI Imports
import { ConnectInstagramAlert } from "@/components/global/connectInstagram.alert";
import { Card } from "@/components/theme/ui/card";
import LoadingButton from "@/components/ui/button-loading";
import { Form } from "@/components/ui/form";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";
import CommentTriggerInputs from "./form/commentConsent";
import CommentContentTarget from "./form/commentContentTarget";

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
    conditions: z
      .array(
        z.object({
          type: z.string().min(1, "نوع شرط الزامی است"),
          value: z.string().min(1, "مقدار شرط الزامی است"),
          id: z.string(),
          conditionId: z.string().optional().nullable(),
        }),
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
        products: z
          .array(
            z
              .object({
                id: z.string().optional().nullable(),
                images: z
                  .array(
                    z.object({
                      url: z.string().optional().nullable(),
                      id: z.number().optional().nullable(),
                    }),
                  )
                  .optional()
                  .nullable(),
                _xid: z.string().optional().nullable(),
              })
              .nullable()
              .optional(),
          )
          .nullable()
          .optional(),
        // Just for sending data
        productIds: z.array(z.string()).optional().nullable(),
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
        buttonTemplate: z
          .object({
            text: z.string().min(1),
            buttons: z.array(
              z.object({
                title: z.string().min(1),
                url: z
                  .string()
                  .regex(REGEX_URL)
                  .transform((val) => val.toLowerCase()),
                _xid: z.string().optional().nullable(),
              }),
            ),
          })
          .optional()
          .nullable(),
      }),
    ),
    instagramPost: z
      .object({
        mediaUrl: z.string().optional().nullable(),
        mediaId: z.string().min(1, "انتخاب پست الزامی است"),
      })
      .optional()
      .nullable(),
    isDirect: z.boolean(),
    isComment: z.boolean(),
    commentStartText: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    commentStartTitle: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    justFollowers: z.boolean(),
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),
    isRemindersEnabled: z
      .boolean()
      .nullable()
      .optional()
      .transform((data) => data || false),
    reminderTime: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    reminders: z.array(
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
        products: z
          .array(
            z
              .object({
                id: z.string().optional().nullable(),
                images: z
                  .array(
                    z.object({
                      url: z.string().optional().nullable(),
                      id: z.number().optional().nullable(),
                    }),
                  )
                  .optional()
                  .nullable(),
                _xid: z.string().optional().nullable(),
              })
              .nullable()
              .optional(),
          )
          .nullable()
          .optional(),
        // Just for sending data
        productIds: z.array(z.string()).optional().nullable(),
        id: z.string().optional().nullable(),
        haveInstagramPost: z
          .boolean()
          .optional()
          .nullable()
          .transform((data) => undefined),
        _xid: z.string().optional().nullable(),
        buttonTemplate: z
          .object({
            text: z.string().min(1),
            buttons: z.array(
              z.object({
                title: z.string().min(1),
                url: z.string().regex(REGEX_URL),
                _xid: z.string().optional().nullable(),
              }),
            ),
          })
          .optional()
          .nullable(),
      }),
    ),
    commentTexts: z.array(z.string().min(1)).nullable().optional(),
    isReplyCommentEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.reminders.length > 0 && !data.reminderTime) {
      ctx.addIssue({
        path: ["reminderTime"],
        code: "custom",
        message: "required",
      });
    }

    data.contents.forEach((content, index) => {
      // Type issues
      if (content.type === ContentCycleContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ["contents", index, "text"],
          code: "custom",
          message: "required",
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
          message: "required",
        });
        return;
      }

      if (
        (content.type === ContentCycleContentTypesEnum.AUDIO ||
          content.type === ContentCycleContentTypesEnum.VIDEO ||
          content.type === ContentCycleContentTypesEnum.IMAGE) &&
        !content.file &&
        !content.file
      ) {
        // For files: video, image, voice
        ctx.addIssue({
          path: ["contents", index, "file"],
          code: "custom",
          message: "required",
        });
      }
    });
  });

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export default function ContentCycle({ id }: ContentCycleProps) {
  const t_ec = useTranslations("ERROR_CODES");
  const t = useTranslations("Automations");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof contentCycleFormSchema>>({
    resolver: zodResolver(contentCycleFormSchema),
    defaultValues: {
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [],
      isDirect: true,
      isComment: false,
      justFollowers: false,
      isRemindersEnabled: false,
      reminders: [],
      isReplyCommentEnabled: false,
      commentStartText: t("commentStartText"),
      commentStartTitle: t("commentStartTitle"),
      followCheckMessage: t("followCheckMessage"),
    },
  });

  const {
    data: contentCycle,
    isLoading: isContentCycleLoading,
    error: contentCycleError,
  } = useSWRImmutable(`/contentCycle/${id}`, {
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (!contentCycle) {
      return;
    }
    form.reset({
      ...contentCycle,
      ...(contentCycle.reminders?.length > 0 && { isRemindersEnabled: true }),
      reminderTime: contentCycle.reminderTime
        ? `${contentCycle.reminderTime}`
        : undefined,
      isReplyCommentEnabled: !!contentCycle.commentTexts?.length,
    });
  }, [contentCycle, form]);

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

    if (
      values.isComment &&
      (values.contents[0].type === ContentCycleContentTypesEnum.PRODUCT ||
        values.contents.length > 1) &&
      !values.justFollowers &&
      !values.commentStartText
    ) {
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

    for (const content of values.contents) {
      if (content.type === ContentCycleContentTypesEnum.PRODUCT) {
        content.productIds = [];
        if (content.products) {
          for (const product of content.products) {
            if (product?.id) {
              content.productIds.push(product.id);
            }
          }
        }
      }
    }

    for (const content of values.reminders) {
      if (content.type === ContentCycleContentTypesEnum.PRODUCT) {
        content.productIds = [];
        if (content.products) {
          for (const product of content.products) {
            if (product?.id) {
              content.productIds.push(product.id);
            }
          }
        }
      }
    }

    if (haveError) {
      setIsSubmitting(false);
      return;
    }

    if (!values.commentStartText) {
      values.commentStartText = t("commentStartText");
    }

    if (!values.commentStartTitle) {
      values.commentStartTitle = t("commentStartTitle");
    }

    if (!values.followCheckMessage) {
      values.followCheckMessage = t("followCheckMessage");
    }

    setIsSubmitting(true);
    await api({
      method: id ? "PATCH" : "POST",
      url: `/contentCycle${id ? `/${id}` : ""}`,
      data: values,
    })
      .then((res) => {
        toast.error(t("success"));
        router.push("/automations");
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        if (e.response?.data?.code == "INSTAGRAM_REQUIRED") {
          toast.error(t_ec(e.response?.data?.code), {
            action: {
              label: t("goToInstagram"),
              onClick: () => router.push("/settings/instagram"),
            },
          });
          return;
        }
        toast.error(t_ec(e.response?.data?.code));
      })
      .then(() => setIsSubmitting(false));
  };

  const { hasInstagram } = useUser();

  return (
    <FormProvider {...form}>
      <div className="_add-automation h-full xl:w-1/2 2xl:w-1/3">
        <Card
          className={cn(
            "border-l-2 border-gray-100 px-3 md:p-5 2xl:pb-7",
            isContentCycleLoading ? "h-full" : "min-h-full",
          )}
        >
          {isContentCycleLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {!hasInstagram && <ConnectInstagramAlert />}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-3.5"
                >
                  <Trigger control={form.control} getValues={form.getValues} />

                  <hr className="border-gray-100" />

                  <Conditions
                    control={form.control}
                    getValues={form.getValues}
                    formState={form.formState}
                  />

                  <hr className="border-gray-100" />

                  <Contents
                    contentCycleId={id}
                    mode={ContentCycleContentModeEnum.CONTENT_CYCLE}
                  />

                  <CommentContentTarget />

                  <CommentReplies />

                  <Reminder />

                  <hr className="border-gray-100" />

                  <JustFollowers
                    control={form.control}
                    getValues={form.getValues}
                  />

                  <CommentTriggerInputs />

                  {/* Submit button */}
                  <LoadingButton className="mt-3" isLoading={isSubmitting}>
                    {id ? t("update_automation") : t("add_automation")}
                  </LoadingButton>
                </form>
              </Form>
            </>
          )}
        </Card>
      </div>
    </FormProvider>
  );
}
