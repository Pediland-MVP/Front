import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Control, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

type JustFollowersProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};
export default function JustFollowers({
  control,
  getValues,
}: JustFollowersProps) {
  return (
    <>
      <FormField
        control={control}
        name="justFollowers"
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
              <FormLabel className="">ارسال به شرط فالو داشتن صفحه</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {getValues().justFollowers && (
        <>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">متن پیام</FormLabel>
                <p className="text-sm mb-1">
                  با فعال کردن این گزینه، پیام مشخص شده در صورتی ارسال می‌شود که
                  کاربر، صفحه شما را دنبال (فالو) کرده باشد در غیر این صورت پیام
                  زیر نمایش داده می‌شود.
                </p>
                <FormControl>
                  <Input
                    placeholder="لطفا برای ادامه صفحه ما را فالو کنید ..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="followCheckMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">متن دکمه بررسی مجدد</FormLabel>
                <FormControl>
                  <Input
                    placeholder="فالو کردم"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}
