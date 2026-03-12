"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { useCallback, useState, useRef, useEffect } from "react";
import { useFieldArray, useFormContext, Control } from "react-hook-form";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AutomationButtons } from "./AutomationButtons";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/* ----------------------------- Types ----------------------------- */

export type VitrinItem = {
  imageId?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
};

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

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

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
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg");
  });
}

async function uploadCroppedImage(
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<string> {
  const response = await api.post(`${API_URL}/contentCycle/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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
  return response.data.id;
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
      console.error("Error cropping image:", error);
      toast.error("Error cropping image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleConfirm, onCancel],
  );

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent
        className="max-w-lg"
        onKeyDown={handleKeyDown}
        aria-describedby="crop-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <p id="crop-dialog-description" className="sr-only">
          Adjust the crop area for your image. Use the slider to zoom in or out.
        </p>
        <div className="relative h-80 w-full bg-gray-100">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="zoom-slider" className="shrink-0 text-sm">
            Zoom
          </Label>
          <input
            id="zoom-slider"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom level"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <Cross1Icon className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <CheckIcon className="h-4 w-4" />
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
  vitrin: VitrinItem;
  onUpdate: (index: number, data: VitrinItem) => void;
  onRemove: (index: number) => void;
  control: any;
  baseFieldName: string;
  contentIndex: number;
  mode: AutomationContentModeEnum;
};

function VitrinItemCard({
  vitrinIndex,
  vitrin,
  onUpdate,
  onRemove,
  control,
  baseFieldName,
  contentIndex,
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropDialogOpen(false);
    setSelectedImageSrc(null);
    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, "cropped-image.jpg");

      const imageId = await uploadCroppedImage(formData, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }));
      });

      const imageUrl = URL.createObjectURL(croppedBlob);

      onUpdate(vitrinIndex, {
        ...vitrin,
        imageId,
        imageUrl,
      });

      setUploadState({ isUploading: false, progress: 100, error: null });
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Upload error:", axiosError);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: "Upload failed. Please try again.",
      });
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setSelectedImageSrc(null);
  };

  const handleRetry = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex w-full flex-col gap-y-3 rounded-lg pl-0">
      {/* Image Upload Area */}
      <div
        className={cn(
          "relative h-[150px] w-full cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors sm:h-[180px]",
          "hover:border-primary/50 hover:bg-muted/50",
          uploadState.error && "border-destructive",
        )}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={vitrin.imageUrl ? "Replace image" : "Upload image"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          aria-hidden="true"
        />

        {vitrin.imageUrl ? (
          <Image
            src={vitrin.imageUrl}
            alt={vitrin.title || "Vitrin image"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
            <UploadIcon className="h-8 w-8" />
            <span className="text-sm font-medium">Uploader</span>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {uploadState.isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
            <Progress value={uploadState.progress} className="w-2/3" />
            <span className="text-sm text-white">{uploadState.progress}%</span>
          </div>
        )}

        {/* Error Overlay */}
        {uploadState.error && (
          <div className="bg-destructive/80 absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
            <span className="text-sm text-white">{uploadState.error}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Title Input */}
      <FormField
        name={`${baseFieldName}.${contentIndex}.vitrins.${vitrinIndex}.title`}
        control={control}
        render={({ field }) => (
          <FormItem>
            <Label className="sr-only">Title</Label>
            <Input
              {...field}
              placeholder="Title"
              className="w-full"
              value={field.value || ""}
            />
          </FormItem>
        )}
      />

      {/* Description Input */}
      <FormField
        name={`${baseFieldName}.${contentIndex}.vitrins.${vitrinIndex}.description`}
        control={control}
        render={({ field }) => (
          <FormItem>
            <Label className="sr-only">Description</Label>
            <Textarea
              {...field}
              placeholder="Description"
              className="w-full resize-none"
              rows={2}
              value={field.value || ""}
            />
          </FormItem>
        )}
      />

      <AutomationButtons
        contentIndex={vitrinIndex}
        mode={mode}
        contentType="text"
      />

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(vitrinIndex)}
        className="text-destructive hover:bg-destructive/10 flex items-center gap-2"
      >
        <TrashIcon className="h-4 w-4" />
        Remove
      </Button>

      {/* Image Cropper Dialog */}
      <ImageCropperDialog
        open={cropDialogOpen}
        imageSrc={selectedImageSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

/* ----------------------------- Main VitrinContent Component ----------------------------- */

export default function VitrinContent({
  index,
  mode,
  control,
}: VitrinContentProps) {
  const t = useTranslations("Automations.Contents.Vitrin");
  const containerRef = useRef<HTMLDivElement>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const baseFieldName =
    mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders";

  const { fields, update, append, remove } = useFieldArray({
    control: control,
    name: `${baseFieldName}.${index}.vitrins`,
  });

  // Sync carousel navigation state
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const handleAppend = () => {
    const targetIndex = fields.length;
    append({
      imageId: undefined,
      imageUrl: undefined,
      title: "",
      description: "",
    });
    if (carouselApi) {
      const handleReInit = () => {
        carouselApi.scrollTo(targetIndex);
        carouselApi.off("reInit", handleReInit);
      };
      carouselApi.on("reInit", handleReInit);
    }
  };

  const handleUpdate = (vitrinIndex: number, data: VitrinItem) => {
    update(vitrinIndex, data);
  };

  const handleRemove = (vitrinIndex: number) => {
    remove(vitrinIndex);
  };

  const handlePrev = () => {
    carouselApi?.scrollPrev();
  };

  const handleNext = () => {
    carouselApi?.scrollNext();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {t("title", { defaultValue: "Vitrin Items" })}
        </Label>
        <span className="text-muted-foreground text-xs">
          ({fields.length} items)
        </span>
      </div>

      <div className="flex w-full min-w-0 items-center gap-2">
        {/* Left Navigation */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={!canScrollPrev}
          aria-label="Previous item"
          className="shrink-0"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>

        {/* Carousel */}
        <div
          ref={containerRef}
          className="relative min-w-0 flex-1"
          style={{
            contain: "inline-size",
          }}
        >
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "center",
              containScroll: "trimSnaps",
            }}
            className="w-full"
          >
            <CarouselContent>
              {fields.map((field, vitrinIndex) => (
                <CarouselItem key={field.id} className="basis-full px-2">
                  <VitrinItemCard
                    vitrinIndex={vitrinIndex}
                    vitrin={field as unknown as VitrinItem}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                    control={control}
                    baseFieldName={baseFieldName}
                    contentIndex={index}
                    mode={mode}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Right Navigation / Add Button */}
        <div className="flex shrink-0 flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canScrollNext}
            aria-label="Next item"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAppend}
            aria-label="Add new vitrin item"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}