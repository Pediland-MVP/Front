// src/components/Automations/form/CommentReplies.tsx
"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from "@befroosh/ui";
import { TextboxIcon, TrashSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { SeperateLine, HelpMeDialog } from "@befroosh/ui-custom";

export const CommentReplies = () => {
  const { watch, control, setValue, clearErrors } = useFormContext();
  const t = useTranslations("Automations.CommentReplies");

  const onIsReplyCommentEnabled = (isActive: boolean) => {
    setValue("isReplyCommentEnabled", isActive);

    if (isActive) {
      setValue("commentTexts", [
        "به دایرکت شما ارسال شد ✅",
        "دایرکتتون رو چک کنید لطفا 🙏",
        "براتون ارسال شد ❤️",
      ]);

      // Clear any existing errors for commentTexts fields
      clearErrors("commentTexts");

      return;
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

  if (!watch("isComment")) {
    return null;
  }

  return (
    <>
      <SeperateLine />

      <FormField
        control={control}
        name="isReplyCommentEnabled"
        render={({ field }) => (
          <FormItem>
            <div className="relative flex items-center gap-x-2">
              <HelpMeDialog
                title={t("Help.title")}
                description={t("Help.description")}
                videoSrc={
                  WizardVideoLinks.Automations.Hints.CommentReplies.video
                }
                position="left"
              />
              <FormControl>
                <Switch
                  type="button"
                  checked={field.value}
                  onCheckedChange={onIsReplyCommentEnabled}
                />
              </FormControl>
              <FormLabel>{t("is_enabled.label")}</FormLabel>
            </div>

            <FormDescription className="text-[13px]">
              {t("is_enabled.description")}
            </FormDescription>
            <FormMessage />

            {field.value && (
              <div className="mt-1 space-y-2.5">
                {watch("commentTexts").map(
                  (commentText: string, index: number) => (
                    <FormField
                      key={index}
                      control={control}
                      name={`commentTexts.${index}`}
                      render={({ field, fieldState: { error } }) => (
                        <FormItem>
                          <div className="flex items-center justify-center gap-1.5">
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                              ></Input>
                            </FormControl>

                            {index > 2 && (
                              <Button
                                onClick={() => onDelete(index)}
                                variant="link"
                                size="icon"
                                type="button"
                              >
                                <TrashSimpleIcon className="text-destructive" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ),
                )}
                <div className="flex flex-col">
                  <Button
                    onClick={onAddComment}
                    type="button"
                    variant="secondary"
                    disabled={watch("commentTexts").length >= 10}
                  >
                    <TextboxIcon />
                    {t("add_comment")}
                  </Button>
                </div>
              </div>
            )}
          </FormItem>
        )}
      />
    </>
  );
};
