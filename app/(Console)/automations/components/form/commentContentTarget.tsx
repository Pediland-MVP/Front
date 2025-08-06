// app/(Console)/automations/components/form/commentContentTarget.tsx

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/theme/ui/form";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import DialogInstagramPostSelect from "../dialog.instagramPostSelect";
import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import z from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useEffect } from "react";

export default function CommentContentTarget() {
  const { watch, control, setValue } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.CommentContentTarget");

  const toggleHandler = (value: boolean) => {
    if (value === false) {
      setValue('instagramPost', null)
    }
    setValue('isCommentContentTargetEnabled', value)    
  }

  if (!watch("isComment")) {
    return null;
  }

  return (
    <>
      <hr className="border-gray-100" />

      <FormField
        control={control}
        name="isCommentContentTargetEnabled"
        render={({ field }) => (
          <FormItem>
            <div className="relative mb-2 flex items-center gap-x-2">
              <FormControl>
                <Switch
                  type="button"
                  dir="ltr"
                  checked={field.value}
                  onCheckedChange={toggleHandler}
                />
              </FormControl>
              <FormLabel className="">
                {t("isCommentContentTargetEnabled.label")}
              </FormLabel>
            </div>

            {field.value && (
              <DialogInstagramPostSelect
                className="mt-4"
                btnVariant="secondary"
                index={0}
                mode={ContentCycleContentModeEnum.CONTENT_CYCLE}
              />
            )}
          </FormItem>
        )}
      />
    </>
  );
}
