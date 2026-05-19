"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import { ButtonTypeEnum } from "@/types/buttons.enum";
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

import { Button, Form } from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import { SeperateLine } from "@/components/ui-custom/SeperateLine";
import { ConnectInstagramAlert } from "./ConnectInstagramAlert";
import {
  CommentReplies,
  CommentTriggerInputs,
  Conditions,
  ConditionTypesEnum,
  Contents,
  JustFollowers,
  Reminder,
  TargetPostComment,
  Triggers,
} from "./Form";
import { ValidationTypeEnum } from "@/types/validationType.enum";
import { CommentLimitAlert } from "./Form/CommentLimitAlert";

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
      conditionType: ConditionTypesEnum.EQUAL,
      isNoCondition: false,
      commentStartText: t("comment_start_text"),
      commentStartTitle: t("comment_start_title"),
      conditions: [{ type: "EQUAL", value: "" }],
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

    const transformButtons = (buttons: any[]) => {
      return buttons?.map((b: any) => {
        const btn = { ...b };

        // Normalize type
        const typeToNormalize = btn.type || btn.postbackPayloadType;

        if (typeToNormalize) {
          const lowerType = typeToNormalize.toLowerCase();
          if (lowerType === "text" || lowerType === ButtonTypeEnum.TEXT) {
            btn.type = ButtonTypeEnum.TEXT;
            btn.postbackPayloadType = ButtonTypeEnum.TEXT;
          } else if (lowerType === "url" || lowerType === ButtonTypeEnum.URL) {
            btn.type = ButtonTypeEnum.URL;
            btn.postbackPayloadType = ButtonTypeEnum.URL;
          } else if (
            lowerType === "contentcycle" ||
            lowerType === "automation" ||
            typeToNormalize === "AUTOMATION" ||
            lowerType === ButtonTypeEnum.START_AUTOMATION.toLowerCase()
          ) {
            btn.type = ButtonTypeEnum.START_AUTOMATION;
            btn.postbackPayloadType = ButtonTypeEnum.START_AUTOMATION;
          }
        }

        if (
          btn.type === ButtonTypeEnum.START_AUTOMATION &&
          btn.destinationContentCycle
        ) {
          return {
            ...btn,
            destinationContentCycleId: btn.destinationContentCycle.id,
          };
        }
        return btn;
      });
    };

    const transformContent = (c: any) => {
      const content = { ...c };
      if (content.buttonTemplate?.buttons) {
        content.buttonTemplate = {
          ...content.buttonTemplate,
        };
        const buttons = transformButtons(content.buttonTemplate.buttons);

        if (content.validationType === ValidationTypeEnum.Selectbox) {
          content.valdationType = ValidationTypeEnum.Text;
        }

        // Sort buttons: if priority exists, use it. Otherwise maintain order (or use ID).
        // Assuming lighter priority value means earlier in the list (1, 2, 3...)
        buttons?.sort((a: any, b: any) => {
          const pA = a.priority ?? 9999;
          const pB = b.priority ?? 9999;
          if (pA !== pB) return pA - pB;
          return 0;
        });

        content.buttonTemplate.buttons = buttons;
      }

      if (content.vitrins?.length) {
        content.vitrins = content.vitrins.map(v => ({
          ...v,
          imageId: v.images[0]?.id,
          imageUrl: v.images[0]?.url,
          ...content.vitrins.buttons?.length && {
            buttons: transformButtons(content.vitrins.buttons)
          }
        }))
      }

      if (content.type === AutomationContentTypesEnum.DELAY) {
        if (content.delayMs >= 1000 * 60 * 60) {
          content.delayUnit = "hour"
        } else if (content.delayMs >= 1000 * 60) {
          content.delayUnit = "min"
        } else {
          content.delayUnit = 'sec'
        }
      }

      return content;
    };

    const transformedAutomation = {
      ...automation,
      contents: automation.contents?.map(transformContent),
      reminders: automation.reminders?.map(transformContent),
      conditionType: automation.isNoCondition
        ? ConditionTypesEnum.NO_CONDITION
        : automation.conditions?.[0]?.type,
    };
    form.reset({
      ...transformedAutomation,
      ...(transformedAutomation.reminders?.length > 0 && {
        isRemindersEnabled: true,
      }),
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

    // TotalDelays should be under 23 hours
    let totalDelaysMs: number = 0;
    let lastDelayContentIndex: number = null
    values.contents.forEach((c, index) => {
      if (c.type === AutomationContentTypesEnum.DELAY) {
        totalDelaysMs += c.delayMs
        lastDelayContentIndex = index
      }
    })

    if (totalDelaysMs > ((1000 * 60 * 60) * 23)) {
      toast.error(t("Errors.totalDelayMsShouldBeUnder23Hour"))
      haveError = true
    }

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

    // Set Priority for buttons
    const setButtonPriorities = (contentsList: typeof values.contents) => {
      contentsList.forEach((content) => {
        if (content.buttonTemplate?.buttons) {
          content.buttonTemplate.buttons.forEach((btn, idx) => {
            btn.priority = idx + 1;
          });
        }
      });
    };

    setButtonPriorities(values.contents);
    if (values.reminders) {
      setButtonPriorities(values.reminders);
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

    console.log("Submited values", JSON.stringify(values, undefined, " "))

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
                onSubmit={form.handleSubmit(onSubmit, (e) => {
                  console.log(e);
                  toast.error(t("form_errors"));
                })}
                className="grid gap-3.5"
              >
                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <Conditions
                    control={form.control}
                    getValues={form.getValues}
                  />
                  <SeperateLine />

                  <Triggers control={form.control} getValues={form.getValues} />
                  <TargetPostComment />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <Contents
                    automationId={id}
                    mode={AutomationContentModeEnum.AUTOMATION}
                  />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <JustFollowers
                    control={form.control}
                    getValues={form.getValues}
                  />

                  <CommentReplies />

                  <CommentTriggerInputs />

                  <CommentLimitAlert />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ButtonLoading isLoading={isSubmitting} className="flex-1">
                      {id ? t("save_changes") : t("add_automation")}
                    </ButtonLoading>
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1"
                      onClick={() => router.back()}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
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
