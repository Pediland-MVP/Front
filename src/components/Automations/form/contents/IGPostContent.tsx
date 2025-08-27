// src/components/Automations/Form/Contents/IGPostContent.tsx
"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Button, ErrorMessage } from "@/components/index";
import { IGPostContentDialog } from "./IGPostContentDialog";

const PAGE_SIZE = 9;

export type InstagramPostContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
};

export const IGPostContent = ({ index, mode }: InstagramPostContentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Automations.Contents.InstagramPost");
  const t_err = useTranslations("Automations.Contents.InstagramPost.Errors");

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<AutomationFormType>();

  const fieldPath =
    mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders";

  // Watch the specific field directly
  const watchedPost = watch(`${fieldPath}.${index}.instagramPost`);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {watchedPost?.mediaUrl ? (
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={watchedPost.mediaUrl}
              alt="Instagram post cover"
              width={250}
              height={0}
              className="aspect-square rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 duration-150 hover:opacity-100">
              <Button type="button" size="sm" onClick={() => setIsOpen(true)}>
                {t("change")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="hover:border-primary flex aspect-square items-center justify-center rounded-lg border bg-gray-300">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsOpen(true)}
              >
                {t("select")}
              </Button>
            </div>
            {(errors as any)?.[fieldPath]?.[index]?.instagramPost && (
              <ErrorMessage className="col-span-3">
                {t_err("selection_required")}
              </ErrorMessage>
            )}
          </>
        )}
      </div>

      <IGPostContentDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        index={index}
        mode={mode}
      />
    </>
  );
};
