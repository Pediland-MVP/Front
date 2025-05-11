import { useTranslations } from "next-intl";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import ErrorMessage from "@/components/ui/errorMessage";
import { FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/theme/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/theme/ui/select";
import { Trash, PlusCircle } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { ContentCycleConditionTypes } from "@/types/contentCycles/conditions";

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
  const [isRendered, setIsRendered] = useState<boolean>(false)

  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    update: updateConditions,
    swap: swapConditions,
    replace: replaceConditions
  } = useFieldArray({
    control: control,
    name: "conditions",
    keyName: "_xid",
  });

  useEffect(() => {
    if (isRendered || !conditionsField) return

    if (conditionsField?.[0].type) {
      setCurrentType(conditionsField[0].type as ContentCycleConditionTypes)
    }

  }, [conditionsField])

  const toggleConditionType = () => {
    setCurrentType((old) => {
      let newType: "INCLUDE" | "EQUAL";
      if (old === "INCLUDE") {
        newType = "EQUAL";
      } else {
        newType = "INCLUDE";
      }

      replaceConditions(conditionsField.map(condition => ({...condition, type: newType})))

      return newType;
    });

  };

  return (
    <>
      <div className="space-y-1">
        <div className=" flex">
          <p className="text-sm font-medium">{t("wordOrPhrase")} {' '} <span onClick={toggleConditionType}>
            {currentType === "INCLUDE" ? t("include") : t("equal")}
          </span></p>
        </div>
        <div className=" space-y-4">
          {conditionsField.map((condition, index) => (
            <div
              key={condition.id}
              className="flex flex-col xl:flex-row gap-3 items-center"
            >
              <div className="w-full flex items-center gap-2">
                <Controller
                  name={`conditions.${index}.value`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem className="flex-1">
                      <Input {...field} type="text" placeholder={t("value")} />
                      {/* {error && (
              <FormMessage> {error.message} </FormMessage>
            )} */}
                    </FormItem>
                  )}
                />

                {/* Delete Icon */}
                {getValues().conditions?.length > 1 && (
                  <div>
                    <Trash
                      size={20}
                      className="text-red-600 cursor-pointer"
                      onClick={() => removeConditions(index)}
                      aria-label={t("deleteCondition")}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() =>
                  appendConditions({ type: currentType!, value: "", id: "" })
                }
                variant="ghost"
                type="button"
                className="flex items-center gap-2 cursor-pointer px-2"
              >
                <PlusCircle size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {t("addNewCondition")}
                </span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {formState?.errors?.conditions?.map &&
        formState.errors.conditions.map((state, index) => {
          return (
            <ErrorMessage key={index}>{state?.value?.message}</ErrorMessage>
          );
        })}

      {/* Message input & post select */}
      <p className="text-sm font-medium">{t("sendMessageBelow")}</p>
    </>
  );
}
