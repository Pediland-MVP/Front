import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TitleProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};
export default function ContentCycleTitle({ control }: TitleProps) {
  return (
    <FormField
      control={control}
      name="title"
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel>عنوان</FormLabel>
          <FormControl>
            <Input {...field} placeholder="برای این اتوماسیون یک عنوان انتخاب کنید" />
          </FormControl>
          {error && <FormMessage> {error.message} </FormMessage>}
        </FormItem>
      )}
    />
  );
}
