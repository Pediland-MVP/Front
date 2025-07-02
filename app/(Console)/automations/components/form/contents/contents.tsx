"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { PlusCircle } from "@phosphor-icons/react/dist/ssr";
import ErrorMessage from "@/components/ui/errorMessage";
import ContentItem from "./contentItem";
import {
  ContentCycleContentModeEnum,
  ContentCycleContentTypesEnum,
} from "@/app/constants/contentCycleContent.enum";
import { ContentsUploaderContextProvider } from "./useContentsUploaderContext";
import { UploadedFile } from "@/components/theme/types/fileUploader";
import { ContentsContext } from "./useContentsContext";
import HelpmeDialog from "@/components/global/helpme.dialog";
import useUser from "@/hooks/useUser";
import ContentPromotion from "./contentPromotion";

// Sortable Item Component

type ContentsProps = {
  mode: ContentCycleContentModeEnum;
};
export default function Contents({ mode }: ContentsProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const {
    fields: contents,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
    insert: insertContents
  } = useFieldArray({
    control: control,
    name:
      mode === ContentCycleContentModeEnum.REMINDER ? "reminders" : "contents",
    keyName: "_xid",
  });

  const t = useTranslations("Automations.Contents");
  const t_errors = useTranslations("Automations.Errors");

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = contents.findIndex((field) => field._xid === active.id);
      const newIndex = contents.findIndex((field) => field._xid === over?.id);

      moveContents(oldIndex, newIndex);
    }
  };

  const { user } = useUser();
  const isPromotion = user?.instagrams?.[0]?.isPromotion;

  return (
    <ContentsContext.Provider
      value={{ contents, updateContents, removeContents }}
    >
      <div className="space-y-3 relative">
        {mode === ContentCycleContentModeEnum.CONTENT_CYCLE && (
          <div className="w-full flex justify-center items-center">
            <HelpmeDialog
              noAbsolute
              title={t("Help.title")}
              description={t("Help.description")}
              videoSrc="https://befroosh.storage.iran.liara.space/IMG_2330.MOV"
            />
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={contents.map((field) => field._xid)}
            strategy={rectSortingStrategy}
          >
            {contents.length > 0 && (
              <div className="space-y-3">
                {contents.map((content, index) => (
                  <ContentsUploaderContextProvider
                    defaultValue={content.file as UploadedFile}
                    key={content._xid}
                  >
                    <ContentItem mode={mode} id={content._xid} index={index} />
                  </ContentsUploaderContextProvider>
                ))}
              </div>
            )}
          </SortableContext>

          <SortableContext
            disabled
            items={contents.map((field) => field._xid)}
            strategy={rectSortingStrategy}
          >
            {
              isPromotion && (
                <ContentPromotion/>
              )
            }
          </SortableContext>
        </DndContext>
        <Button
          variant="ghost"
          onClick={() =>
            appendContents({
              type: ContentCycleContentTypesEnum.TEXT,
              ...(mode === ContentCycleContentModeEnum.CONTENT_CYCLE && {
                haveConsent: false,
              }),
            })
          }
          type="button"
          className="flex items-center gap-2 cursor-pointer w-full"
        >
          <PlusCircle size={22} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">
            {t("addContent")}
          </span>
        </Button>
      </div>
      {errors.contents?.message === "at_least" && (
        <ErrorMessage>
          {t_errors(`contents.${errors.contents.message}`)}
        </ErrorMessage>
      )}
    </ContentsContext.Provider>
  );
}
