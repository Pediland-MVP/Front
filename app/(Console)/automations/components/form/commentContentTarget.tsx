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

export default function CommentContentTarget() {
  const { watch, control, setValue } = useFormContext();
  const t = useTranslations("Automations.CommentContentTarget");

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
                  onCheckedChange={field.onChange}
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
