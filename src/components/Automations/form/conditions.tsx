// app/(Console)/automations/components/form/conditions.tsx
"use client";

import { ContentCycleConditionTypes } from "@/types/contentCycles/conditions";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";
import { contentCycleFormSchema } from "../contentCycle";

// UI Imports
import HelpmeDialog from "@/components/global/helpme.dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ErrorMessage from "@/components/ui/errorMessage";
import { PlusCircleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";

type TriggerProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

export default function Conditions({
  control,
  getValues,
  formState,
}: TriggerProps) {
  const t = useTranslations("Automations.Conditions");
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
        <p className="text-sm font-medium">
          {t("wordOrPhrase")}{" "}
          <span onClick={toggleConditionType}>
            {currentType === "INCLUDE" ? t("include") : t("equal")}
          </span>
        </p>

        <HelpmeDialog
          position="left"
          title={t("Help.title")}
          description={t("Help.description")}
          videoSrc={WizardVideoLinks.Automations.Hints.Conditions.video}
        />
      </div>

      <div className="space-y-2">
        {conditionsField.map((condition, index) => (
          <div
            key={condition.id}
            className="flex flex-col items-center gap-2 xl:flex-row"
          >
            <div className="flex w-full items-center gap-2">
              <Controller
                name={`conditions.${index}.value`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Input {...field} type="text" placeholder={t("value")} />
                )}
              />

              {/* Delete Icon */}
              {getValues().conditions?.length > 1 && (
                <TrashIcon
                  size={18}
                  className="cursor-pointer text-red-600"
                  onClick={() => removeConditions(index)}
                  aria-label={t("deleteCondition")}
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
                <PlusCircleIcon size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {t("addNewCondition")}
                </span>
              </Button>
            )}
          </div>
        ))}
      </div>

      {formState?.errors?.conditions?.map &&
        formState.errors.conditions.map((state, index) => {
          return (
            <ErrorMessage key={index}>{state?.value?.message}</ErrorMessage>
          );
        })}

      {/* Message input & post select */}
      <div>
        <p className="mb-1 text-sm font-medium">{t("sendMessageBelow")}</p>
        <p className="text-sm text-gray-600">{t("note")}</p>
      </div>
    </div>
  );
}
