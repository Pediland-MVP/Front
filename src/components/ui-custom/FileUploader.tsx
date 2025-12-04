import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import AnimatedCircularProgressBar from "../ui/animated-circular-progress-bar";

import { UploadSimple, UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr";

import { useTranslations } from "next-intl";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const FileUploader = ({
  onChange,
  type = "file",
  accept = "*",
  multiple = false,
  images = [],
  progress = 0,
  isUploading = false,
  className,
}: {
  onChange?: (files: File[]) => void;
  type?: "file" | "image";
  accept?: string;
  images?: string[];
  multiple?: boolean;
  progress?: number;
  isUploading?: boolean;
  className?: string;
}) => {
  const t = useTranslations("FileUpload");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    if (multiple) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } else {
      setFiles((prevFiles) => [...newFiles]);
    }
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error: any) => {
      console.error(error);
    },
  });

  return (
    <div className={cn(className, "relative duration-300")} {...getRootProps()}>
      {isUploading && (
        <AnimatedCircularProgressBar
          className="absolute top-5 right-5 h-10 w-10 font-sans text-xs"
          gaugeSecondaryColor="#bababa"
          gaugePrimaryColor="black"
          max={100}
          min={0}
          value={progress}
        />
      )}
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file relative block w-full cursor-pointer overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type={type}
          accept={accept}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 mask-[radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-muted-foreground relative w-full text-[13px]">
            {t("description")}
          </p>
          <div className="relative m-10 mx-auto w-full max-w-xl">
            <ImageGrid images={images} />

            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative z-40 mx-auto flex w-full flex-col items-start justify-start overflow-hidden rounded-md bg-white p-4 md:h-24",
                    "shadow-sm",
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="max-w-xs truncate text-base text-neutral-700"
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="shadow-input w-fit shrink-0 rounded-lg px-2 py-1 text-sm text-neutral-600"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="mt-2 flex w-full flex-col items-start justify-between text-sm text-neutral-600 md:flex-row md:items-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-md bg-gray-100 px-1 py-0.5"
                    >
                      {file.type}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                }}
                className={cn(
                  "relative z-40 mx-auto flex h-32 w-full max-w-32 items-center justify-center rounded-md bg-white group-hover/file:shadow-2xl",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]",
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-neutral-600"
                  >
                    {t("dropIt")}
                    <UploadSimpleIcon size={28} className="text-neutral-600" />
                  </motion.p>
                ) : (
                  <UploadSimpleIcon size={28} className="text-neutral-600" />
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute inset-0 z-30 mx-auto mt-4 flex w-full max-w-32 items-center justify-center rounded-md border border-gray-200 bg-transparent opacity-0"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex shrink-0 scale-105 flex-wrap items-center justify-center gap-x-px gap-y-px bg-gray-100">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`flex h-10 w-10 shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50"
                  : "bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset]"
              }`}
            />
          );
        }),
      )}
    </div>
  );
}

const ImageGrid = ({ images }: { images: string[] }) => {
  if (images.length === 0) return null;

  const gridColsClass =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <div
      className={`grid ${gridColsClass} mb-4 place-items-center justify-center gap-4`}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-square h-40 w-40 overflow-hidden rounded-md"
        >
          <Image
            src={image}
            alt={`Uploaded image ${index + 1}`}
            layout="fill"
            objectFit="cover"
          />
        </div>
      ))}
    </div>
  );
};
