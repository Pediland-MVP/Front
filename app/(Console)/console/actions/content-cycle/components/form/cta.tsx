import { FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

type CtaProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

export default function Cta({ control }: CtaProps) {
  return (
    <FormField
      name="cta"
      control={control}
      render={({ field, fieldState: { error } }) => {
        return (
          <div>
            <FormLabel>متن مرحله پایانی</FormLabel>
            <Textarea
              {...field}
              placeholder="خیلی ممنون که چرخه رو کامل کردید..."
            />
            {error && <FormMessage> {error.message} </FormMessage>}
          </div>
        );
      }}
    ></FormField>
  );
}
