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

  const {
    fields: conditionsField,
    remove: removeConditions,
    append: appendConditions,
    update: updateConditions,
    swap: swapConditions,
  } = useFieldArray({
    control: control,
    name: "conditions",
    keyName: "_xid",
  });

  return (
    <>
      <div className="space-y-1">
        <p>{t("wordOrPhrase")}</p>
        <div className=" space-y-4">
          {conditionsField.map((condition, index) => (
            <div
              key={condition.id}
              className="flex flex-col xl:flex-row gap-3 items-center"
            >
              <div className="w-full flex items-center gap-2">
                <Controller
                  name={`conditions.${index}.type`}
                  control={control}
                  defaultValue="EQUAL"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem className="w-full">
                      <Select
                        {...field}
                        dir="rtl"
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("equal")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="EQUAL">{t("equal")}</SelectItem>
                            <SelectItem value="INCLUDE">
                              {t("include")}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {error && <FormMessage>{error.message}</FormMessage>}
                    </FormItem>
                  )}
                />
                <span className="text-sm">{t("with")}</span>
              </div>
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
                  appendConditions({ type: "EQUAL", value: "", id: "" })
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
      <p>{t("sendMessageBelow")}</p>
    </>
  );
}
