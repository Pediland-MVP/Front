// src/components/Automations/Automation.tsx
"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { cn } from "@befroosh/lib/utils";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";
import { CommentReplies } from "./Form/CommentReplies";
import { Conditions } from "./Form/Conditions";
import { Contents } from "./Form/Contents/Contents";
import { JustFollowers } from "./Form/JustFollowers";
import { Reminder } from "./Form/Reminder";
import { Triggers } from "./Form/Triggers";

// UI Imports
import { ConnectInstagramAlert } from "@/components/Global/connectInstagram.alert";
import {
  Card,
  CommentContentTarget,
  CommentTriggerInputs,
  Form,
} from "@befroosh/ui";
import LoadingSpinner from "@/components/ui-custom/LoaderSpin";
import LoadingButton from "@befroosh/ui";
import { toast } from "sonner";
import {
  AutomationFormSchema,
  AutomationFormType,
} from "@/schemas/automationForm";
import { useI18nZodErrors } from "@/hooks/useI18nZodErrors";

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

type AutomationProps = {
  id?: string;
};

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export const Automation = ({ id }: AutomationProps) => {
  const t = useTranslations("Automations");
  const t_ec = useTranslations("ERROR_CODES");
  const t_err = useTranslations("Errors");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();
  useI18nZodErrors();

  const form = useForm<AutomationFormType>({
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

  const {
    data: automation,
    isLoading: isAutomationLoading,
    error: automationError,
  } = useSWRImmutable(`/contentCycle/${id}`, {
    revalidateOnMount: true,
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

  const onSubmit = async (values: AutomationFormType) => {
    // Validate Optionals
    let haveError: boolean = false;

    if (
      values.isComment &&
      (values.contents[0].type === AutomationContentTypesEnum.PRODUCT ||
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
            isAutomationLoading ? "h-full" : "min-h-full",
          )}
        >
          {isAutomationLoading ? (
            <LoadingSpinner />
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

                  <JustFollowers
                    control={form.control}
                    getValues={form.getValues}
                  />

                  <CommentTriggerInputs />

                  {/* Submit button */}
                  <LoadingButton className="mt-3" isLoading={isSubmitting}>
                    {id
                      ? t("update_automationsssss")
                      : t("add_automation11111")}
                  </LoadingButton>
                </form>
              </Form>
            </>
          )}
        </Card>
      </div>
    </FormProvider>
  );
};
