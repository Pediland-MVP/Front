"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";
import { contentTypeOptions } from "./ContentTypeOptions";
// TODO: Refactor Types & Schemas
import type { AutomationFormType } from "@/schemas/automationForm";
import type { UploadedFile } from "@/types/fileUploader";

import {
  Alert,
  AlertDescription,
  Button,
  ContentItem,
  ContentPromotion,
  ContentsContext,
  ContentsUploaderContextProvider,
  ErrorMessage,
  HelpMeDialog,
} from "@components";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { PlusCircleIcon } from "lucide-react";

type ContentsProps = {
  mode: AutomationContentModeEnum;
  automationId?: string | undefined;
};

export const Contents = ({ mode, automationId }: ContentsProps) => {
  const { user } = useUser();
  const t = useTranslations("Automations.Contents");
  const t_contentTypes = useTranslations("Automations.Contents.Types");
  const t_err = useTranslations("Automations.Contents.Errors");
  const isPromotion = user?.instagrams?.[0]?.isPromotion;

  const {
    control,
    trigger,
    clearErrors,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const [isChoosingType, setIsChoosingType] = useState(
    !!automationId || mode === AutomationContentModeEnum.REMINDER
      ? false
      : true,
  );

  const arrayName =
    mode === AutomationContentModeEnum.REMINDER
      ? "reminders"
      : ("contents" as const);

  const {
    fields: contents,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
    insert: insertContents,
  } = useFieldArray({
    control: control,
    name: arrayName,
    keyName: "_xid",
  });

  const watched = useWatch({ name: arrayName, control });
  const hasItems = (watched?.length ?? 0) > 0;

  useEffect(() => {
    if (
      hasItems &&
      ((errors as any)?.[arrayName]?.root?.message ||
        (errors as any)?.[arrayName]?.message)
    ) {
      clearErrors(arrayName);
    }
  }, [hasItems, arrayName, clearErrors, errors]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over?.id) {
      const oldIndex = contents.findIndex((field) => field._xid === active.id);
      const newIndex = contents.findIndex((field) => field._xid === over?.id);

      moveContents(oldIndex, newIndex);
    }
  };

  const arrayErrors = (errors as any)?.[arrayName];
  const arrayErrorMsg = arrayErrors?.root?.message ?? arrayErrors?.message;
  const arrayErrorType = arrayErrors?.root?.type ?? arrayErrors?.type;

  // useEffect(() => {
  //   console.log("Watching contents...", contents);
  // }, [contents]);

  return (
    <ContentsContext.Provider
      value={{ contents, updateContents, removeContents }}
    >
      <div className="_content-item flex flex-col gap-3">
        {contents.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contents.map((field) => field._xid)}
              strategy={rectSortingStrategy}
            >
              {contents
                .filter((content) => !!content.type)
                .map((content, index) => (
                  <ContentsUploaderContextProvider
                    defaultValue={content.file as UploadedFile}
                    key={content._xid}
                  >
                    <ContentItem mode={mode} id={content._xid} index={index} />
                  </ContentsUploaderContextProvider>
                ))}
            </SortableContext>
          </DndContext>
        )}

        <SortableContext
          disabled
          items={contents.map((field) => field._xid)}
          strategy={rectSortingStrategy}
        >
          {isPromotion && <ContentPromotion />}
        </SortableContext>

        {isChoosingType && (
          <div className="grid w-full grid-cols-5 justify-start gap-x-1.5 gap-y-2.5">
            {contentTypeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                onClick={() => {
                  appendContents({
                    type:
                      option.value === "media"
                        ? AutomationContentTypesEnum.IMAGE
                        : option.value,
                    ...(mode === AutomationContentModeEnum.AUTOMATION && {
                      haveConsent: false,
                    }),
                    ...(option.value ===
                      AutomationContentTypesEnum.BUTTON_TEMPLATE && {
                      buttonTemplate: {
                        text: "",
                        buttons: [
                          {
                            url: "",
                            title: "",
                          },
                        ],
                      },
                    }),
                  });
                  setIsChoosingType(false);
                  clearErrors(arrayName);
                }}
                className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-md bg-blue-100 text-[13px] text-blue-900 shadow-blue-200 hover:bg-blue-200/50 hover:shadow-blue-400/60 md:h-9 md:flex-row md:justify-start md:gap-1 md:!px-2 [&_svg:not([class*='size-'])]:size-4.5"
              >
                {option.icon}
                {t_contentTypes(option.value)}
              </Button>
            ))}

            <Alert variant="note" className="col-span-5">
              <AlertDescription>
                {t_contentTypes("select_your_type")}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {arrayErrorMsg && (
          <ErrorMessage>{t_err(arrayErrorType) ?? arrayErrorMsg}</ErrorMessage>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            type="button"
            className="text-blue-600"
            disabled={isChoosingType}
            onClick={() => setIsChoosingType(true)}
          >
            <PlusCircleIcon />
            {t("add_content")}
          </Button>

          <HelpMeDialog
            position="left"
            title={t("Help.title")}
            description={t("Help.description")}
            videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
          />
        </div>
      </div>
    </ContentsContext.Provider>
  );
};
