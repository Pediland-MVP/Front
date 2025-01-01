"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import InstagramPostsDialog from "../../../components/instagramPosts.dialog";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Just UI Imports Below
import { Textarea } from "@/components/theme/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash, ArrowsOutCardinal } from "@phosphor-icons/react/dist/ssr";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/theme/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export default function ContentItem({
  id,
  index,
  contentsField,
  removeContents,
  updateContents,
}: {
  id: string;
  index: number;
  contentsField: any[];
  removeContents: (index: number) => void;
  updateContents: (index: number, value: any) => void;
}) {
  const { control, setValue, trigger, getValues } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const t = useTranslations("Automations.Contents");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    removeContents(index);
    if (index === 0) {
      setValue("isContentsEnabled", false);
    } 

    // if the index is 1, set the haveConsent to false because for consent we need at least 2 item
    if (index === 1) {
      updateContents(0, {
        ...getValues().contents?.[0],
        haveConsent: false
      })
    }
    trigger();
  };

  const haveInstagramPost = !!getValues().contents?.[index]?.instagramPost;

  const onHaveInstagramPostChanges = (isEnabled: boolean) => {
    if (!isEnabled) {
      updateContents(index, {
        ...getValues().contents?.[index],
        instagramPost: null,
        haveInstagramPost: isEnabled,
      });
    } else {
      updateContents(index, {
        ...getValues().contents?.[index],
        haveInstagramPost: isEnabled,
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-blue-50 p-3 rounded-xl flex flex-col items-start gap-y-4"
    >
      <div className="_header flex justify-between items-center w-full">
        <div {...attributes} {...listeners} className="cursor-move">
          <ArrowsOutCardinal size={20} />
        </div>
        <div>
          <Trash
            size={22}
            className="text-red-600 cursor-pointer"
            onClick={deleteContent}
            aria-label={t("removeContent")}
          />
        </div>
      </div>

      <div className="_content gap-3 flex flex-col w-full">
        <div className="flex flex-col gap-2 w-full">
          <Controller
            name={`contents.${index}.text`}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <Textarea placeholder={t("enterYourMessage")} {...field} />
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />

          <FormField
            name={`contents.${index}.haveConsent`}
            control={control}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-start gap-y-2">
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <TooltipProvider>
                      <Tooltip {...contentsField.length > 1 && {open: false}}>
                        <TooltipTrigger asChild disabled={contentsField.length > 1}>
                          <Checkbox
                            disabled={contentsField.length <= 1}
                            dir="ltr"
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("consentTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormControl>
                  <FormLabel className="">{t("consent")}</FormLabel>
                </div>
                {!!field.value && (
                  <Controller
                    name={`contents.${index}.consentText`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <Input placeholder={t("consentMessage")} {...field} />
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name={`contents.${index}.haveInstagramPost`}
            control={control}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-start gap-y-2">
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <Checkbox
                      dir="ltr"
                      checked={haveInstagramPost || field.value || false}
                      onCheckedChange={onHaveInstagramPostChanges}
                    />
                  </FormControl>
                  <FormLabel className="">{t("haveInstagramPost")}</FormLabel>
                </div>
                {(haveInstagramPost || field.value) && (
                  <div className="relative flex justify-center items-center">
                    <InstagramPostsDialog
                      index={index}
                      updateContents={updateContents}
                      contents={contentsField}
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
