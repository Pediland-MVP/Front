// src/components/Automations/AutomationDetails.tsx
"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
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

// UI Imports
import { ConnectInstagramAlert } from "@/components/Global/connectInstagram.alert";
import { Button, ErrorMessage, Form } from "@/components/index";
import LoaderSpin from "@/components/ui-custom/LoaderSpin";
import LoadingButton from "@/components/ui/button-loading";
import { AutomationFormSchema } from "@/schemas/automationForm";
import { toast } from "sonner";
import {
  CommentContentTarget,
  CommentReplies,
  CommentTriggerInputs,
  Conditions,
  Contents,
  JustFollowers,
  Reminder,
  Triggers,
} from "./form";
import { useI18nZodErrors } from "@/lib/useI18nZodErrors";

type AutomationDetailsProps = {
  id?: string;
};

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export const AutomationDetails = ({ id }: AutomationDetailsProps) => {
  useI18nZodErrors();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { hasInstagram, isLoading } = useUser();
  const t_ec = useTranslations("ERROR_CODES");
  const t = useTranslations("Automations");

  const isUUID = (s?: string) =>
    !!s &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s,
    );

  const key = isUUID(id) ? `/contentCycle/${id}` : null;
  const {
    data: automation,
    isLoading: isAutomationLoading,
    error: automationError,
  } = useSWRImmutable(key, {
    revalidateOnMount: !!id,
  });

  const form = useForm<z.infer<typeof AutomationFormSchema>>({
    resolver: zodResolver(AutomationFormSchema),
    defaultValues: {
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [],
      isDirect: true,
      isComment: false,
      justFollowers: false,
      isRemindersEnabled: false,
      reminders: [],
      isReplyCommentEnabled: false,
      commentStartText: t("comment_start_text"),
      commentStartTitle: t("comment_start_title"),
      followCheckMessage: t("follow_check_message"),
      isCommentContentTargetEnabled: false,
    },
  });

  useEffect(() => {
    if (!automation) {
      return;
    }
    form.reset({
      ...automation,
      ...(automation.reminders?.length > 0 && { isRemindersEnabled: true }),
      reminderTime: automation.reminderTime
        ? `${automation.reminderTime}`
        : undefined,
      isReplyCommentEnabled: !!automation.commentTexts?.length,
      isCommentContentTargetEnabled: !!automation.instagramPost,
    });
  }, [automation, form]);

  const onSubmit = async (values: z.infer<typeof AutomationFormSchema>) => {
    // Validate Optionals
    let haveError: boolean = false;
    if (!values.isComment && !values.isDirect) {
      form.setError("isDirect", {
        message: "باید حداقل یکی از حالت‌های کامنت و دایرکت روشن باشد",
      });
      form.setFocus("isDirect");
      haveError = true;
    }

    const firstType = values.contents[0]?.type;

    if (
      values.isComment &&
      (firstType === AutomationContentTypesEnum.PRODUCT ||
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
      if (content.type === AutomationContentTypesEnum.PRODUCT) {
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
      if (content.type === AutomationContentTypesEnum.PRODUCT) {
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
      values.commentStartText = t("comment_start_text");
    }

    if (!values.commentStartTitle) {
      values.commentStartTitle = t("comment_start_title");
    }

    if (!values.followCheckMessage) {
      values.followCheckMessage = t("follow_check_message");
    }

    setIsSubmitting(true);
    await api({
      method: id ? "PATCH" : "POST",
      url: `/contentCycle${id ? `/${id}` : ""}`,
      data: values,
    })
      .then((res) => {
        toast.success(t("success"));
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

  return (
    <FormProvider {...form}>
      <div className={cn("_automation-details min-h-full")}>
        {isAutomationLoading || isLoading ? (
          <LoaderSpin />
        ) : (
          <>
            {!hasInstagram && <ConnectInstagramAlert />}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-3.5"
              >
                <Triggers control={form.control} getValues={form.getValues} />

                <hr className="border-gray-100" />

                <Conditions
                  control={form.control}
                  getValues={form.getValues}
                  formState={form.formState}
                />

                <hr className="border-gray-100" />

                <Contents
                  automationId={id}
                  mode={AutomationContentModeEnum.AUTOMATION}
                />

                <CommentContentTarget />

                <CommentReplies />

                <Reminder />

                <hr className="border-gray-100" />

                <CommentTriggerInputs />

                <JustFollowers
                  control={form.control}
                  getValues={form.getValues}
                />

                <div className="mt-4 flex items-center gap-2">
                  <LoadingButton isLoading={isSubmitting} className="w-full">
                    {id ? t("save_changes") : t("add_automation")}
                  </LoadingButton>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {automationError && <ErrorMessage>{t_ec("LOAD_FAILED")}</ErrorMessage>}
      </div>
    </FormProvider>
  );
};
