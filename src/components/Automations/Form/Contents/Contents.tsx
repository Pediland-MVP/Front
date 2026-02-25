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
import { ButtonTypeEnum } from "@/types/buttons.enum";

import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import { Alert, AlertDescription, AlertTitle, Button } from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
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
import { ContentItem } from "./ContentItem";
import { ContentPromotion } from "./ContentPromotion";
import { ContentsContext } from "./ContentsContext";
import { ContentsUploaderContextProvider } from "./ContentsUploaderContext";
import { ValidationTypeEnum } from "@/types/validationType.enum";
import { QuestionTextErrorMessage } from "./QuestionContent";
import { FilePlusIcon } from "@phosphor-icons/react/dist/ssr";

type ContentsProps = {
  mode: AutomationContentModeEnum;
  automationId?: string | undefined;
};

export const Contents = ({ mode, automationId }: ContentsProps) => {
  const t = useTranslations("Automations.Contents");
  const t_contentTypes = useTranslations("Automations.Contents.Types");
  const t_err = useTranslations("Automations.Contents.Errors");
  const { user } = useUser();

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
        {contents.length === 0 && (
          <div className="my-4 flex flex-col items-center justify-center">
            <FilePlusIcon size={100} className="mb-3 opacity-10" />
            <p className="font-bold text-gray-500">هنوز محتوایی اضافه نشده‌است</p>
            {/* <p className="text-center text-sm">
              روی دکمه "افزودن محتوا" کلیک کنید و نوع محتوای خود را انتخاب کنید
            </p> */}
          </div>
        )}
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
          {isPromotion &&
            contents.length > 0 &&
            mode === AutomationContentModeEnum.AUTOMATION && (
              <ContentPromotion />
            )}
        </SortableContext>

        {isChoosingType && (
          <>
            <Alert variant="note" className="col-span-5">
              <AlertTitle>{t_contentTypes("select_your_type")}</AlertTitle>
            </Alert>
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
                              title: "",
                            },
                          ],
                        },
                      }),
                      ...(option.value ===
                        AutomationContentTypesEnum.QUESTION && {
                        validationType: ValidationTypeEnum.Text,
                        validationErrorMessage: QuestionTextErrorMessage,
                      }),
                    });
                    setIsChoosingType(false);
                    clearErrors(arrayName);
                  }}
                  className="flex flex-col items-center justify-center rounded-md bg-blue-100 p-7 text-[13px] text-blue-900 shadow-blue-200 hover:bg-blue-200/50 hover:shadow-blue-400/60"
                >
                  {option.icon}
                  {t_contentTypes(`buttons.titles.${option.value}`)}
                </Button>
              ))}
            </div>
          </>
        )}

        {arrayErrorMsg && (
          <ErrorMessage>{t_err(arrayErrorType) ?? arrayErrorMsg}</ErrorMessage>
        )}

        {(contents.length > 0 && !isChoosingType) && (
          <div className="flex items-center justify-center">
            <Button
              variant="default"
              type="button"
              className="bg-primary w-11/12 text-white"
              disabled={isChoosingType}
              onClick={() => setIsChoosingType(true)}
            >
              <PlusCircleIcon />
              {t("add_content")}
            </Button>
            <div className="relative w-1/12">
              <HelpMeDialog
                position="center"
                title={t("Help.title")}
                description={t("Help.description")}
                videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
              />
            </div>
          </div>
        )}
      </div>
    </ContentsContext.Provider>
  );
};
