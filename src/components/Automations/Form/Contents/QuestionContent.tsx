import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { ValidationTypeEnum } from "@/types/validationType.enum";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FormField,
  FormItem,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { InputCounter } from "@/components/ui-custom/InputCounter";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { AutomationButtons } from "./AutomationButtons";

export type QuestionContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  control: any;
};

export const QuestionContent = ({
  index,
  mode,
  control,
}: QuestionContentProps) => {
  const t = useTranslations("Automations.Contents.Text");
  const t_err = useTranslations("Automations.Contents.Text.Errors");
  const { watch, setValue } = useFormContext();

  const fieldName =
    mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders";
  const validationType = watch(`${fieldName}.${index}.validationType`);

  // Default error messages based on validation type
  const getDefaultErrorMessage = (type: ValidationTypeEnum) => {
    switch (type) {
      case ValidationTypeEnum.Mobile:
        return "شماره موبایل شما صحیح نیست";
      case ValidationTypeEnum.Email:
        return "ایمیل شما صحیح نیست";
      case ValidationTypeEnum.NationalCode:
        return "کد ملی شما درست نیست";
      case ValidationTypeEnum.Number:
        return "عدد وارد شده صحیح نیست";
      case ValidationTypeEnum.Text:
      default:
        return "متن وارد شده صحیح نیست";
    }
  };

  // Update error message when validation type changes
  const handleValidationTypeChange = (value: ValidationTypeEnum) => {
    setValue(`${fieldName}.${index}.validationType`, value);
    setValue(
      `${fieldName}.${index}.validationErrorMessage`,
      getDefaultErrorMessage(value),
    );
  };

  return (
    <>
      <FormField
        name={`${fieldName}.${index}.text`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormItem className="w-full">
            <Label>
              {t.rich("you_can_use_vars", {
                name: (chunks) => (
                  <span className="text-blue-500">{chunks}</span>
                ),
              })}
            </Label>
            <Textarea
              rows={4}
              maxLength={1000}
              {...field}
              aria-invalid={!!error}
              className="w-full"
            />
            <InputCounter text={field.value} maxLength={1000} />
            {error && <ErrorMessage>{t_err("required")}</ErrorMessage>}
          </FormItem>
        )}
      />

      <div className="flex flex-col items-start justify-center">
        <FormField
          name={`${fieldName}.${index}.validationType`}
          control={control}
          render={({ field }) => (
            <FormItem className="w-full">
              <Label>نوع اعتبارسنجی</Label>
              <Select
                value={field.value || ""}
                onValueChange={(value) =>
                  handleValidationTypeChange(value as ValidationTypeEnum)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="نوع اعتبارسنجی را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ValidationTypeEnum.Mobile}>
                    موبایل
                  </SelectItem>
                  <SelectItem value={ValidationTypeEnum.Email}>
                    ایمیل
                  </SelectItem>
                  <SelectItem value={ValidationTypeEnum.NationalCode}>
                    کد ملی
                  </SelectItem>
                  <SelectItem value={ValidationTypeEnum.Text}>متن</SelectItem>
                  <SelectItem value={ValidationTypeEnum.Number}>عدد</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          name={`${fieldName}.${index}.validationErrorMessage`}
          control={control}
          render={({ field }) => (
            <FormItem className="w-full">
              <Label>پیام خطای اعتبارسنجی</Label>
              <Textarea
                {...field}
                placeholder="پیام خطا برای اعتبارسنجی"
                rows={3}
                className="w-full"
              />
            </FormItem>
          )}
        />
      </div>

      <AutomationButtons contentIndex={index} mode={mode} contentType="question" />
    </>
  );
};
