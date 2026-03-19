"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { useCallback, useState, useRef, useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";
import {
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
  UploadIcon,
  CheckIcon,
  Cross1Icon,
} from "@radix-ui/react-icons";

import {
  Button,
  Input,
  Textarea,
  Label,
  FormField,
  FormItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { AutomationButtons } from "./AutomationButtons";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { AutomationFormSchema, VitrinItemType } from "@/schemas/automationForm";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/* ----------------------------- Types ----------------------------- */

export type VitrinContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  control: any;
};

type UploadState = {
  isUploading: boolean;
  progress: number;
  error: string | null;
};

/* ----------------------------- Helper Functions ----------------------------- */

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg");
  });
}

async function uploadCroppedImage(
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<{id: number, url: string}> {
  const response = await api.post(`${API_URL}/contentCycle/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100,
        );
        onProgress(progress);
      }
    },
  });
  return response.data;
}

/* ----------------------------- Image Cropper Dialog ----------------------------- */

type ImageCropperDialogProps = {
  open: boolean;
  imageSrc: string | null;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
};

function ImageCropperDialog({
  open,
  imageSrc,
  onConfirm,
  onCancel,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(croppedBlob);
    } catch (error) {
      toast.error("Error cropping image");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="relative h-80 w-full bg-gray-100">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <Label className="shrink-0 text-sm">Zoom</Label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <Cross1Icon className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
            <CheckIcon className="mr-2 h-4 w-4" />{" "}
            {isProcessing ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Single Vitrin Item ----------------------------- */

type VitrinItemCardProps = {
  vitrinIndex: number;
  onUpdate: (index: number, data: VitrinItemType) => void;
  onRemove: (index: number) => void;
  control: any;
  baseFieldName: 'contents' | 'reminders';
  parentContentIndex: number;
  mode: AutomationContentModeEnum;
};

function VitrinItemCard({
  vitrinIndex,
  onUpdate,
  onRemove,
  control,
  baseFieldName,
  parentContentIndex,
  mode,
}: VitrinItemCardProps) {
  const t = useTranslations("Automations.Contents.Vitrin");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // **Form context (we'll use setValue to update ONLY nested fields)**
  const { setValue, watch } = useFormContext<z.infer<typeof AutomationFormSchema>>();
  const itemBasePath: `${'contents' | 'reminders'}.${number}.vitrins.${number}` = `${baseFieldName}.${parentContentIndex}.vitrins.${vitrinIndex}`;

  const vitrin = useWatch({
    control,
    name: itemBasePath
  })

  // keep a ref to previous object URL so we can revoke it and avoid leaks
  const prevObjectUrlRef = useRef<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadState((prev) => ({
        ...prev,
        error: "Please select an image file",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const imagePreviewRef = useRef<HTMLImageElement>(null)

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropDialogOpen(false);
    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "image.jpg");

      const { id: imageId, url: imageUrl} = await uploadCroppedImage(formData, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }));
      });

      // Revoke previous object URL if it was created locally by preview
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch (err) {
          // ignore
        }
      }
      prevObjectUrlRef.current = imageUrl;

      console.log("Image uploaded", JSON.stringify({itemBasePath, imageId, imageUrl, vitrin}, undefined, " "))

      // IMPORTANT: update only the nested fields — do NOT replace the entire item
      onUpdate(vitrinIndex, { ...vitrin, imageUrl, imageId});

      setUploadState({ isUploading: false, progress: 100, error: null });
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: "Upload failed",
      });
      toast.error("Upload failed");
    }
  };
  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        } catch (err) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-y-3">
      <div
        className={cn(
          "hover:bg-muted/50 relative h-[180px] w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-all",
          uploadState.error && "border-destructive",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {vitrin?.imageUrl ? (
          <Image
            ref={imagePreviewRef}
            src={vitrin.imageUrl}
            alt="vitrin"
            fill
            className="object-cover"
          />
        ) : (
          <FormField
            name={`${baseFieldName}.${parentContentIndex}.vitrins.${vitrinIndex}.title`}
            control={control}
            render={({ fieldState: { error } }) => (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
                <UploadIcon className="h-8 w-8" />
                <span className="text-sm font-medium">
                  {t("buttons.uploader.title")}
                </span>
                {error && <ErrorMessage>{t(`imageUploader.errors.${error.type}`)}</ErrorMessage>}
              </div>
            )}
          />
        )}

        {uploadState.isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Progress value={uploadState.progress} className="w-2/3" />
            <span className="mt-2 text-xs text-white">
              {uploadState.progress}%
            </span>
          </div>
        )}
      </div>

      <FormField
        name={`${baseFieldName}.${parentContentIndex}.vitrins.${vitrinIndex}.title`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <Input
              {...field}
              placeholder={t("fields.title.placeholder")}
              value={field.value || ""}
            />
            {error && <ErrorMessage>{error.message}</ErrorMessage>}
          </FormItem>
        )}
      />

      <FormField
        name={`${baseFieldName}.${parentContentIndex}.vitrins.${vitrinIndex}.description`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <Textarea
              {...field}
              placeholder={t("fields.description.placeholder")}
              rows={2}
              value={field.value || ""}
            />
            {error && <ErrorMessage>{error.message}</ErrorMessage>}
          </FormItem>
        )}
      />

      <AutomationButtons
        contentIndex={parentContentIndex}
        mode={mode}
        contentType="vitrin"
        fieldNameOverride={`${baseFieldName}.${parentContentIndex}.vitrins.${vitrinIndex}.buttons`}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(vitrinIndex)}
        className="text-destructive hover:bg-destructive/10 flex items-center gap-2"
      >
        <TrashIcon className="h-4 w-4" />
        {t("buttons.remove.title")}
      </Button>

      <ImageCropperDialog
        open={cropDialogOpen}
        imageSrc={selectedImageSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropDialogOpen(false)}
      />
    </div>
  );
}

/* ----------------------------- Main VitrinContent ----------------------------- */

export default function VitrinContent({
  index,
  mode,
  control,
}: VitrinContentProps) {
  const t = useTranslations("Automations.Contents.Vitrin");
  const [currentIndex, setCurrentIndex] = useState(0);

  const baseFieldName =
    mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders";

  const { fields, update } = useFieldArray({
    control,
    name: `${baseFieldName}.${index}.vitrins`,
    keyName: "_xid",
  });

  const vitrins = useWatch({
    control,
    name: `${baseFieldName}.${index}.vitrins`,
  })

  useEffect(() => {
    console.log(JSON.stringify(vitrins, undefined, " "))
  }, [vitrins])

  // در بالای کامپوننت VitrinContent اضافه کن
  const { getValues, setValue } =
    useFormContext<z.infer<typeof AutomationFormSchema>>();

  const {
    formState: { errors },
  } = useFormContext();

  // انتقال به ایندکس دارای خطا
  useEffect(() => {
    const vitrinErrors = (errors as any)?.[baseFieldName]?.[index]?.vitrins;
    if (Array.isArray(vitrinErrors)) {
      const firstErrorIdx = vitrinErrors.findIndex((e: any) => e);
      if (firstErrorIdx !== -1) setCurrentIndex(firstErrorIdx);
    }
  }, [errors, baseFieldName, index]);

  const handleAppend = () => {
    console.log("=== handleAppend START ===", {
      currentLength: fields.length,
      currentIndex,
    });

    const fieldPath: `contents.${number}.vitrins` | `reminders.${number}.vitrins` = `${baseFieldName}.${index}.vitrins`;

    const currentVitrins = getValues(fieldPath) || [];

    const newItem: VitrinItemType = {
      imageId: "",
      imageUrl: "",
      title: "",
      description: "",
      buttons: [],
    };

    const newVitrins = [...currentVitrins, newItem];

    // مستقیماً آرایه را ست می‌کنیم (بهترین راه برای جلوگیری از ghost)
    setValue(fieldPath, newVitrins, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // به آخرین آیتم برو
    setCurrentIndex(newVitrins.length - 1);

    console.log("=== handleAppend END - new length:", newVitrins.length);
  };
  useEffect(() => {
    if (fields.length > 0) {
      setCurrentIndex(fields.length - 1);
    }
  }, [fields.length]);

  const handleRemove = (vIndex: number) => {
    const fieldPath: `contents.${number}.vitrins` | `reminders.${number}.vitrins` = `${baseFieldName}.${index}.vitrins`;
    const currentVitrins = getValues(fieldPath) || [];

    const newVitrins = currentVitrins.filter((_, i) => i !== vIndex);

    setValue(fieldPath, newVitrins, { shouldValidate: true });

    setCurrentIndex((prev) => {
      if (newVitrins.length === 0) return 0;
      return Math.max(0, prev > vIndex ? prev - 1 : prev);
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <Label className="text-sm font-semibold">
          {t("title", { defaultValue: "Vitrin Items" })}
        </Label>
        {fields.length > 0 && (
          <div className="bg-muted rounded-full px-2 py-1 text-xs font-medium">
            {currentIndex + 1} / {fields.length}
          </div>
        )}
      </div>

      <div className="relative flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="h-9 w-9 shrink-0 rounded-full"
        >
          <ArrowRightIcon className="h-5 w-5" />
        </Button>

        <div className="border-muted-foreground/30 bg-muted/5 relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-dashed p-4">
          <AnimatePresence mode="wait">
            {fields.length > 0 && fields[currentIndex] ? (
              <motion.div
                key={fields[currentIndex]._xid} // استفاده از ID منحصر به فرد فیلد
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <VitrinItemCard
                  vitrinIndex={currentIndex}
                  vitrin={fields[currentIndex] as any}
                  onUpdate={update}
                  onRemove={handleRemove}
                  control={control}
                  baseFieldName={baseFieldName}
                  parentContentIndex={index}
                  mode={mode}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground flex h-full flex-col items-center justify-center py-20"
              >
                <p className="text-sm italic">{t("noItems")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentIndex((p) => Math.min(fields.length - 1, p + 1))
            }
            disabled={currentIndex >= fields.length - 1 || fields.length === 0}
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="default"
            size="icon"
            onClick={handleAppend}
            className="bg-primary h-9 w-9 rounded-full shadow-md"
          >
            <PlusIcon className="text-primary-foreground h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
