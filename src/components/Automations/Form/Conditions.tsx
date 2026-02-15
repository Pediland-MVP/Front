"use client";

import { AutomationFormType } from "@/schemas/automationForm";
import { ContentCycleConditionTypes } from "@/types/contentCycles/conditions";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Control,
  useFieldArray,
  useFormContext,
  UseFormGetValues,
} from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import {
  Button,
  FormField,
  FormItem,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { XCircleIcon } from "@phosphor-icons/react";
import { SeperateLine } from "@/components/ui-custom/SeperateLine";

type ConditionsProps = {
  control: Control<AutomationFormType>;
  getValues: UseFormGetValues<AutomationFormType>;
};

export enum ConditionTypesEnum {
  EQUAL = "EQUAL",
  INCLUDE = "INCLUDE",
  NO_CONDITION = "noCondition",
}

export const Conditions = ({ control, getValues }: ConditionsProps) => {
  const t = useTranslations("Automations.Conditions");
  const t_err = useTranslations("Automations.Conditions.Errors");
  const [isRendered, setIsRendered] = useState<boolean>(false);

  const { setValue, watch, trigger } = useFormContext<AutomationFormType>();
  const conditionTypeWatch = watch("conditionType")

  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    replace: replaceConditions,
    insert: insertConditions,
  } = useFieldArray({
    control: control,
    name: "conditions",
    keyName: "_xid",
  });

  useEffect(() => {
    if (isRendered || !conditionsField) return;

    if (conditionsField?.[0]?.type) {
      setValue(
        "conditionType",
        conditionsField[0].type as ContentCycleConditionTypes,
      );
    }
  }, [conditionsField]);

  const handleConditionTypeChange = (newType: ContentCycleConditionTypes) => {
    if (!newType) return
    const prevType = getValues("conditionType");


    if (newType === ConditionTypesEnum.NO_CONDITION) {
      setValue("isComment", true);
      setValue("isDirect", false);
      setValue("isCommentContentTargetEnabled", true);

      // remove conditions when switching to no-condition
      setValue("conditions", []);
      replaceConditions([]);
    } else {
      // insert new item (this mutates internal field array)
      if (prevType == ConditionTypesEnum.NO_CONDITION) {
        replaceConditions([{ type: newType, value: "" }]);
      }

      // read the freshest conditions from the form API (synchronous)
      const currentConditions = getValues("conditions") || [];

      // update types for all conditions based on newType
      const updated = currentConditions.map((c: any) => ({ ...c, type: newType }));

      // replace field array with the updated array (keeps internal ids)
      replaceConditions(updated);

      // ensure form values are synced (probably redundant but safe)
      setValue("conditions", updated);
    }
    setValue("conditionType", newType);
  };

  return (
    <div className="_conditions space-y-2">
      <div className="relative">
        <p className="flex items-center gap-1 text-sm font-medium">
          <span>{t("word_or_phrase")}</span>
          <FormField
            control={control}
            name="conditionType"
            render={({ field }) => {
              return (
                <Select
                  {...field}
                  value={field.value}
                  defaultValue={ConditionTypesEnum.EQUAL}
                  onValueChange={handleConditionTypeChange}
                >
                  <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-1 text-purple-700 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConditionTypesEnum.EQUAL}>
                      {t("equal")}
                    </SelectItem>
                    <SelectItem value={ConditionTypesEnum.INCLUDE}>
                      {t("include")}
                    </SelectItem>
                    <SelectItem value={ConditionTypesEnum.NO_CONDITION}>
                      {t("noCondition")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              );
            }}
          />
        </p>

        <HelpMeDialog
          position="left"
          title={t("Help.title")}
          description={t("Help.description")}
          videoSrc={WizardVideoLinks.Automations.Hints.Conditions.video}
        />
      </div>

      {conditionTypeWatch !== ConditionTypesEnum.NO_CONDITION && (
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
                      {error && (
                        <ErrorMessage>{t_err("required")}</ErrorMessage>
                      )}
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
                    appendConditions({
                      type: watch("conditionType")!,
                      value: "",
                      id: "",
                    })
                  }
                  variant="ghost"
                  type="button"
                >
                  <span className="text-blue-600">
                    {t("add_new_condition")}
                  </span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
