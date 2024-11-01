import ErrorMessage from "@/components/ui/errorMessage";
import { FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@radix-ui/react-select";
import { Trash, PlusCircle } from "@phosphor-icons/react";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormGetValues,
  UseFormStateProps,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Button } from "@/components/ui/button";

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
      <div>
        <p>کلمه یا جمله ای</p>
        <div className=" space-y-4">
          {conditionsField.map((condition, index) => (
            <div key={condition.id} className="flex gap-4 items-center">
              <Controller
                name={`conditions.${index}.type`}
                control={control}
                defaultValue="EQUAL"
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <Select {...field} dir="rtl" onValueChange={field.onChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="برابر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="EQUAL">برابر</SelectItem>
                          <SelectItem value="INCLUDE">شامل</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {error && <FormMessage>{error.message}</FormMessage>}
                  </FormItem>
                )}
              />
              <span className="text-sm">با</span>
              <Controller
                name={`conditions.${index}.value`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <Input
                      {...field}
                      className="max-w-[15rem]"
                      type="text"
                      placeholder="مقدار"
                    />
                    {/* {error && (
                            <FormMessage> {error.message} </FormMessage>
                          )} */}
                  </FormItem>
                )}
              />

              {/* Delete Icon */}
              {getValues().conditions?.length > 1 && (
                <Trash
                  size={24}
                  className="text-red-600 cursor-pointer"
                  onClick={() => removeConditions(index)}
                />
              )}
              <Button
                onClick={() =>
                  appendConditions({ type: "EQUAL", value: "", id: "" })
                }
                variant="ghost"
                type="button"
                className="flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle size={24} />
                <span className="text-sm font-semibold text-blue-600">
                  افزودن شرط جدید
                </span>
              </Button>
            </div>
          ))}
          {/* Add button to add more conditions */}
        </div>
      </div>

      {formState?.errors?.conditions?.map &&
        formState.errors.conditions.map((state, index) => {
          return (
            <ErrorMessage key={index}>{state?.value?.message}</ErrorMessage>
          );
        })}

      {/* Message input & post select */}
      <p>را ارسال کند پیام زیر برایش ارسال شود</p>
    </>
  );
}
