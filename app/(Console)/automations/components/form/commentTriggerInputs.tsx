import { useFormContext } from "react-hook-form";
// Just UI Imports Below
import {
  FormField,
  FormMessage,
  FormLabel,
  FormDescription,
  FormControl,
  FormItem,
} from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/theme/ui/switch";
import { Button } from "@/components/theme/ui/button";
import { Trash, X } from "@phosphor-icons/react/dist/ssr";

export default function CommentTriggerInputs() {
  const { watch, control, setValue } = useFormContext();
  const t = useTranslations("Automations.Trigger");

  const onIsReplyCommentEnabled = (isActive: boolean) => {
    setValue("isReplyCommentEnabled", isActive);
    if (isActive) {
      setValue("commentTexts", [
        "به دایرکت شما ارسال شد ✅",
        "دایرکتتون رو چک کنید لطفا 🙏",
        "براتون ارسال شد ❤️",
      ]);
      return
    }
    setValue("commentTexts", null);
  };

  const onAddComment = () => {
    setValue("commentTexts", [...watch("commentTexts"), ""]);
  };

  const onDelete = (index: number) => {
    const comments = watch("commentTexts");
    comments.splice(index, 1);
    setValue("commentTexts", comments);
  };

  return (
    <>
      {watch("isComment") && !watch('justFollowers') && (
        <>
          <FormField
            control={control}
            name="commentStartText"
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-1">
                <FormLabel>{t("startRequestMessage")}</FormLabel>
                {/* <FormDescription>{t('startRequestMessageDescription')}</FormDescription> */}
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("commentPlaceholder")}
                ></Textarea>
                {error && <FormMessage>{error.message}</FormMessage>}
              </div>
            )}
          />
          <FormField
            control={control}
            name="commentStartTitle"
            render={({ field, fieldState: { error } }) => (
              <div className="space-y-1">
                <FormLabel>{t("commentStartTitle")}</FormLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("commentStartTitlePlaceholder")}
                ></Textarea>
                {error && <FormMessage>{error.message}</FormMessage>}
              </div>
            )}
          />

          <FormField
            control={control}
            name="isReplyCommentEnabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch
                    type="button"
                    dir="ltr"
                    checked={field.value}
                    onCheckedChange={onIsReplyCommentEnabled}
                    className="ml-2"
                  />
                </FormControl>
                <FormLabel className="">
                  {t("isReplyCommentEnabled.label")}
                </FormLabel>
                <FormDescription>
                  {t("isReplyCommentEnabled.description")}
                </FormDescription>
                <FormMessage />
                {field.value && (
                  <>
                    {watch("commentTexts").map(
                      (commentText: string, index: number) => (
                        <FormField
                          key={index}
                          control={control}
                          name={`commentTexts.${index}`}
                          render={({ field, fieldState: { error } }) => (
                            <FormItem>
                              <div className=" flex justify-center items-center gap-x-1">
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder={t("commentPlaceholder")}
                                  ></Textarea>
                                </FormControl>
                                {index > 2 && (
                                  <Button
                                    onClick={() => onDelete(index)}
                                    variant={"outline"}
                                    size={"icon"}
                                    type="button"
                                    className="flex justify-center items-center box-border"
                                  >
                                    <X />
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    )}
                    <Button
                      onClick={onAddComment}
                      type="button"
                      disabled={watch("commentTexts").length >= 10}
                    >
                      {t("addComment")}
                    </Button>
                  </>
                )}
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}
