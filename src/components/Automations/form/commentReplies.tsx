// src/components/Automations/form/CommentReplies.tsx
"use client";

import { useFormContext } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";
import { useTranslations } from "next-intl";

// UI Imports
import {
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  HelpMeDialog,
  Input,
  Switch,
} from "@/components/index";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

export const CommentReplies = () => {
  const { watch, control, setValue } = useFormContext();
  const t = useTranslations("Automations.CommentReplies");

  const onIsReplyCommentEnabled = (isActive: boolean) => {
    setValue("isReplyCommentEnabled", isActive);

    if (isActive) {
      setValue("commentTexts", [
        "به دایرکت شما ارسال شد ✅",
        "دایرکتتون رو چک کنید لطفا 🙏",
        "براتون ارسال شد ❤️",
      ]);

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
      <hr className="border-gray-100" />

      <FormField
        control={control}
        name="isReplyCommentEnabled"
        render={({ field }) => (
          <FormItem className="relative">
            <div className="relative flex items-center gap-x-2">
              <HelpMeDialog
                title={t("Help.title")}
                description={t("Help.description")}
                videoSrc={
                  WizardVideoLinks.Automations.Hints.CommentReplies.video
                }
                position="left-top"
              />
              <FormControl>
                <Switch
                  type="button"
                  dir="ltr"
                  checked={field.value}
                  onCheckedChange={onIsReplyCommentEnabled}
                />
              </FormControl>
              <FormLabel className="">
                {t("isReplyCommentEnabled.label")}
              </FormLabel>
            </div>

            <FormDescription className="text-sm">
              {t("isReplyCommentEnabled.description")}
            </FormDescription>
            <FormMessage />

            {field.value && (
              <div className="mt-3 space-y-2.5">
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
                                placeholder={t("commentPlaceholder")}
                              ></Input>
                            </FormControl>

                            {index > 2 && (
                              <Button
                                onClick={() => onDelete(index)}
                                variant={"outline"}
                                size={"icon"}
                                type="button"
                                className="box-border flex items-center justify-center"
                              >
                                <XIcon />
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
                    variant={"secondary"}
                    size={"sm"}
                    disabled={watch("commentTexts").length >= 10}
                  >
                    {t("addComment")}
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
