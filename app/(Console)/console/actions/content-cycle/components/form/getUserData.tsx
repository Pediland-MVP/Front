import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Switch } from "@/components/ui/switch";

type GetUserDataProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

export default function GetUserData({ control }: GetUserDataProps) {
  return (
    <FormField
      control={control}
      name="getUserData.enabled"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-start gap-y-2">
          <div className="flex items-center gap-x-2">
            <FormControl>
              <Switch
                dir="ltr"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="">دریافت اطلاعات کاربر</FormLabel>
          </div>
          {field.value && (
            <div className="mt-2">
              <FormField
                control={control}
                name="getUserData.type"
                render={({ field: selectField }) => (
                  <FormItem>
                    <FormLabel className="">انتخاب نوع اطلاعات</FormLabel>
                    <FormControl>
                      <Select
                        {...selectField}
                        value={selectField.value ?? "email"}
                        dir="rtl"
                        onValueChange={selectField.onChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="email" defaultChecked>
                              ایمیل
                            </SelectItem>
                            <SelectItem value="mobile">شماره موبایل</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="getUserData.text"
                render={({ field: textField }) => (
                  <FormItem>
                    <FormLabel className="">متن سوال</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`لطفا شماره موبایل خود را وارد کنید`}
                        {...textField}
                        value={textField.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </FormItem>
      )}
    />
  );
}
