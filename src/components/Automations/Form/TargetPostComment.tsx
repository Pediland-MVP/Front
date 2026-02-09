"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { InstagramPostSelectDialog } from "./InstagramPostSelectDialog";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Switch
} from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { toast } from "sonner";
import { ConditionTypesEnum } from "./Conditions";

export const TargetPostComment = () => {
  const {
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<AutomationFormType>();
  const t = useTranslations("Automations.TargetPostComment");
  const t_err = useTranslations("Automations.TargetPostComment.Errors");

  const { getValues } = useFormContext<AutomationFormType>()

  const toggleHandler = (value: boolean) => {
    if (value === false) {
      if (getValues('conditionType') === ConditionTypesEnum.NO_CONDITION) {
        toast.error(t_err('targetpost_required_for_noconition'))
        return
      }
      setValue("instagramPost", null);
    } else {
      setValue("isDirect", false);
    }
    setValue("isCommentContentTargetEnabled", value);
  };

  if (!watch("isComment")) {
    return null;
  }

  return (
    <>
      <hr className="border-gray-100" />
      <FormField
        control={control}
        name="isCommentContentTargetEnabled"
        render={({ field }) => (
          <FormItem>
            <div className="relative flex items-center gap-x-2">
              <FormControl>
                <Switch
                  type="button"
                  checked={field.value}
                  onCheckedChange={toggleHandler}
                />
              </FormControl>
              <FormLabel className="">{t("title")}</FormLabel>
            </div>

            {field.value && (
              <>
                <InstagramPostSelectDialog
                  btnVariant="secondary"
                  index={0}
                  mode={AutomationContentModeEnum.AUTOMATION}
                />
                {(errors as any)?.instagramPost && (
                  <ErrorMessage className="mt-1">
                    {t_err("selection_required")}
                  </ErrorMessage>
                )}
              </>
            )}
          </FormItem>
        )}
      />
      {
        watch('isCommentContentTargetEnabled') && (
          <p className="text-muted-foreground text-[13px]">{t("helper")}</p>
        )
      }
    </>
  );
};
