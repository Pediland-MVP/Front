// app/(Console)/automations/components/form/contents/contents.tsx
"use client";

import {
  ContentCycleContentModeEnum,
  ContentCycleContentTypesEnum,
} from "@/constants/contentCycleContent.enum";
import HelpmeDialog from "@/components/global/helpme.dialog";
import { UploadedFile } from "@/components/theme/types/fileUploader";
import { Button } from "@/components/ui/button";
import ErrorMessage from "@/components/ui/errorMessage";
import useUser from "@/hooks/useUser";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
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
import {
  ChatTextIcon,
  InstagramLogoIcon,
  PaperclipIcon,
  PlusCircleIcon,
  RadioButtonIcon,
  ShoppingBagIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";
import { contentCycleFormSchema } from "../../contentCycle";
import ContentItem from "./contentItem";
import ContentPromotion from "./contentPromotion";
import { ContentsContext } from "./useContentsContext";
import { ContentsUploaderContextProvider } from "./useContentsUploaderContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ContentsProps = {
  mode: ContentCycleContentModeEnum;
  contentCycleId?: string | undefined;
};

interface MessageTypeOption {
  value: ContentCycleContentTypesEnum | "media";
  label: string;
  icon: React.ReactNode;
}
const messageTypeOptions: MessageTypeOption[] = [
  {
    value: ContentCycleContentTypesEnum.TEXT,
    label: "Text",
    icon: <ChatTextIcon />,
  },
  {
    value: ContentCycleContentTypesEnum.INSTAGRAM_POST,
    label: "Instagram Post",
    icon: <InstagramLogoIcon />,
  },
  {
    value: ContentCycleContentTypesEnum.PRODUCT,
    label: "Product",
    icon: <ShoppingBagIcon />,
  },
  {
    value: ContentCycleContentTypesEnum.BUTTON_TEMPLATE,
    label: "Button",
    icon: <RadioButtonIcon />,
  },
  //BUG: Dont change my order!
  {
    value: "media",
    label: "Media",
    icon: <PaperclipIcon />,
  },
];

export default function Contents({ mode, contentCycleId }: ContentsProps) {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const [isChoosingType, setIsChoosingType] = useState(
    !!contentCycleId || mode === ContentCycleContentModeEnum.REMINDER
      ? false
      : true,
  );
  const t_messageTypes = useTranslations("MessageTypes");

  const {
    fields: contents,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
    insert: insertContents,
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
    }),
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

            <SortableContext
              disabled
              items={contents.map((field) => field._xid)}
              strategy={rectSortingStrategy}
            >
              {isPromotion && <ContentPromotion />}
            </SortableContext>
          </DndContext>
        )}

        {isChoosingType && (
          <div className="flex w-full flex-wrap justify-evenly gap-2">
            {messageTypeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                onClick={() => {
                  appendContents({
                    type:
                      option.value === "media"
                        ? ContentCycleContentTypesEnum.IMAGE
                        : option.value,
                    ...(mode === ContentCycleContentModeEnum.CONTENT_CYCLE && {
                      haveConsent: false,
                    }),
                    ...(option.value ===
                      ContentCycleContentTypesEnum.BUTTON_TEMPLATE && {
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
                }}
                className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 bg-blue-100/75 text-sm text-blue-900 shadow-blue-200 hover:bg-amber-100/75 hover:shadow-amber-200 md:h-10 md:flex-row md:justify-start md:gap-1.5 [&_svg]:size-5"
              >
                {option.icon}
                {t_messageTypes(option.value)}
              </Button>
            ))}
            <Alert variant={"destructive"} className="mt-2 py-2 text-center">
              <AlertDescription>
                {t_messageTypes("select_your_type")}
              </AlertDescription>
            </Alert>
          </div>
        )}
        {errors.contents?.message === "at_least" && (
          <ErrorMessage>
            {t_errors(`contents.${errors.contents.message}`)}
          </ErrorMessage>
        )}

        <div className="relative">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setIsChoosingType(true)}
          >
            <PlusCircleIcon size={22} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              {t("addContent")}
            </span>
          </Button>

          <HelpmeDialog
            position="left"
            title={t("Help.title")}
            description={t("Help.description")}
            videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
          />
        </div>
      </div>
    </ContentsContext.Provider>
  );
}
