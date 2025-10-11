"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { useI18nZodErrors } from "@/hooks/useI18nZodErrors";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import {
  AutomationFormSchema,
  type AutomationFormType,
} from "@/schemas/automationForm";
import type { ExceptionMessage } from "@/types/exceptionMessage";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import {
  Button,
  ButtonLoading,
  ConnectInstagramAlert,
  ErrorMessage,
  Form,
  LoaderSpin,
  SeperateLine,
} from "@/components/index";
import {
  CommentReplies,
  CommentTriggerInputs,
  Conditions,
  Contents,
  JustFollowers,
  Reminder,
  TargetPostComment,
  Triggers,
} from "./Form";

type AutomationFormProps = {
  id?: string;
};

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export const AutomationForm = ({ id }: AutomationFormProps) => {
  useI18nZodErrors();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { hasInstagram, isLoading } = useUser();
  const t = useTranslations("Automations");
  const t_ec = useTranslations("ERROR_CODES");
  const t_err = useTranslations("Automations.Errors");

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
    mutate: automationMutate,
  } = useSWRImmutable(key, {
    revalidateOnMount: !!id,
  });

  const form = useForm<AutomationFormType>({
    resolver: zodResolver(AutomationFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      commentStartText: t("comment_start_text"),
      commentStartTitle: t("comment_start_title"),
      conditions: [{ type: "EQUAL", value: "", id: "" }],
      contents: [],
      followCheckMessage: t("follow_check_message"),
      isComment: false,
      isCommentContentTargetEnabled: false,
      isDirect: true,
      isRemindersEnabled: false,
      isReplyCommentEnabled: false,
      justFollowers: false,
      reminders: [],
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

  const onSubmit = async (values: AutomationFormType) => {
    let haveError: boolean = false;

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
        toast.success(id ? t("Toast.updated") : t("Toast.created"));
        router.push("/automations");
        mutate(mutateIncludeStringKey("/contentCycle"));
        automationMutate();
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        if (e.response?.data?.code == "INSTAGRAM_REQUIRED") {
          toast.error(t_ec(e.response?.data?.code), {
            action: {
              label: t_err("goToInstagram"),
              onClick: () => router.push("/settings/instagram"),
            },
          });
          return;
        }

        // Handle missing translation keys gracefully
        const errorCode = e.response?.data?.code;

        if (errorCode) {
          try {
            const errorMessage = t_ec(errorCode);
            toast.error(errorMessage);
          } catch (translationError) {
            // Fallback to generic error message if translation key doesn't exist
            console.error(
              "Missing translation for error code:",
              errorCode,
              translationError,
            );
            toast.error("خطایی رخ داده است");
          }
        } else {
          toast.error("خطایی رخ داده است");
        }
      })
      .then(() => setIsSubmitting(false));
  };

  return (
    <FormProvider {...form}>
      <div className={cn("_automation-form flex min-h-full flex-col gap-5")}>
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

                <SeperateLine />

                <Conditions control={form.control} getValues={form.getValues} />

                <SeperateLine />

                <Contents
                  automationId={id}
                  mode={AutomationContentModeEnum.AUTOMATION}
                />

                <TargetPostComment />

                <CommentReplies />

                <Reminder />

                <SeperateLine />

                <CommentTriggerInputs />

                <JustFollowers
                  control={form.control}
                  getValues={form.getValues}
                />

                <div className="mt-4 flex items-center gap-2">
                  <ButtonLoading isLoading={isSubmitting} className="flex-1">
                    {id ? t("save_changes") : t("add_automation")}
                  </ButtonLoading>
                  <Button
                    variant="outline"
                    type="button"
                    className="flex-1 border-gray-200/60 bg-gray-100 text-gray-600"
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
