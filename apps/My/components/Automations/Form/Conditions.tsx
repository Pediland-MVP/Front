// src/components/Automations/form/Conditions.tsx
"use client";

import { AutomationFormType } from "@/schemas/automationForm";
import { ContentCycleConditionTypes } from "@/types/contentCycles/conditions";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Control,
  useFieldArray,
  UseFormGetValues
} from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  Button,
  ErrorMessage,
  FormField,
  FormItem,
  HelpMeDialog,
  Input,
} from "@befroosh/ui";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr";

type ConditionsProps = {
  control: Control<AutomationFormType>;
  getValues: UseFormGetValues<AutomationFormType>;
};

export const Conditions = ({ control, getValues }: ConditionsProps) => {
  const t = useTranslations("Automations.Conditions");
  const t_err = useTranslations("Automations.Conditions.Errors");
  const [currentType, setCurrentType] = useState<ContentCycleConditionTypes>();
  const [isRendered, setIsRendered] = useState<boolean>(false);

  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    replace: replaceConditions,
  } = useFieldArray({
    control: control,
    name: "conditions",
    keyName: "_xid",
  });

  useEffect(() => {
    if (isRendered || !conditionsField) return;

    if (conditionsField?.[0].type) {
      setCurrentType(conditionsField[0].type as ContentCycleConditionTypes);
    }
  }, [conditionsField]);

  const toggleConditionType = () => {
    setCurrentType((old) => {
      let newType: "INCLUDE" | "EQUAL";

      if (old === "INCLUDE") {
        newType = "EQUAL";
      } else {
        newType = "INCLUDE";
      }

      replaceConditions(
        conditionsField.map((condition) => ({ ...condition, type: newType })),
      );

      return newType;
    });
  };

  return (
    <div className="_conditions space-y-2">
      <div className="relative">
        <p className="flex items-center gap-1 text-sm font-medium">
          <span>{t("word_or_phrase")}</span>
          <span onClick={toggleConditionType}>
            {currentType === "INCLUDE" ? t("include") : t("equal")}
          </span>
          <span>{t("below_conditions")}</span>
        </p>

        <HelpMeDialog
          position="left"
          title={t("Help.title")}
          description={t("Help.description")}
          videoSrc={WizardVideoLinks.Automations.Hints.Conditions.video}
        />
      </div>

      <div className="space-y-2">
        {conditionsField.map((condition, index) => (
          <div
            key={condition._xid}
            className="flex flex-col items-start gap-2 xl:flex-row"
          >
            <div className="flex w-full items-start gap-2">
              <FormField
                name={`conditions.${index}.value`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormItem className="w-full">
                    <Input
                      {...field}
                      type="text"
                      placeholder={t("value")}
                      aria-invalid={!!error}
                    />
                    {error && <ErrorMessage>{t_err("required")}</ErrorMessage>}
                  </FormItem>
                )}
              />

              {getValues().conditions?.length > 1 && (
                <XCircleIcon
                  size={20}
                  className="h-9 cursor-pointer text-red-600"
                  onClick={() => removeConditions(index)}
                  aria-label={t("delete_condition")}
                />
              )}
            </div>

            {index === conditionsField?.length - 1 && (
              <Button
                onClick={() =>
                  appendConditions({ type: currentType!, value: "", id: "" })
                }
                variant="ghost"
                type="button"
              >
                <span className="text-blue-600">{t("add_new_condition")}</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">{t("send_message_below")}</p>
        <p className="text-[13px] text-gray-600">{t("note")}</p>
      </div>
    </div>
  );
};
