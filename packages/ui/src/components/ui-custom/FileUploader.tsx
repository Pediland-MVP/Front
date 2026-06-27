import { cn } from '@/lib/utils';
import React, { Fragment, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import AnimatedCircularProgressBar from '../ui/animated-circular-progress-bar';
import { UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr';

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
  type = 'file',
  accept = '*',
  multiple = false,
  images = [],
  progress = 0,
  isUploading = false,
  className,
}: {
  onChange?: (files: File[]) => void;
  type?: 'file' | 'image';
  accept?: string;
  images?: string[];
  multiple?: boolean;
  progress?: number;
  isUploading?: boolean;
  className?: string;
}) => {
  const t = useTranslations('FileUpload');
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
    <div className={cn(className, 'relative duration-300')} {...getRootProps()}>
      <div
        onClick={handleClick}
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
          <p className="text-muted-foreground relative w-full text-[13px]">{t('description')}</p>

          <div className="relative mx-auto grid w-full max-w-xl grid-cols-10 pt-5">
            {/* Show when there are uploaded files OR existing images */}
            {(files.length > 0 || images.length > 0) && (
              <Fragment key={files.length > 0 ? 'file-0' : 'existing-image'}>
                <div className="relative col-span-6 flex w-full items-center justify-center sm:col-span-5">
                  <ImageGrid images={images} />

                  {isUploading && (
                    <div className="absolute top-0 right-1/2 flex aspect-square h-full w-auto translate-x-1/2 items-center justify-center rounded-md bg-black/40">
                      <AnimatedCircularProgressBar
                        className="size-12 font-sans text-sm text-white"
                        gaugeSecondaryColor="#ccc"
                        gaugePrimaryColor="#fff"
                        max={100}
                        min={0}
                        value={progress}
                      />
                    </div>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="col-span-4 flex flex-col items-center justify-center gap-2 sm:col-span-5">
                    <p className="text-sm text-neutral-600">
                      {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p className="max-w-xs truncate text-base text-neutral-700">{files[0].name}</p>
                    <p className="rounded-md bg-gray-100 px-1 py-0.5">{files[0].type}</p>
                  </div>
                )}
              </Fragment>
            )}

            {!(files.length > 0) && (
              <div
                className={cn(
                  'flex min-h-32 items-center justify-center',
                  images.length > 0 ? 'col-span-4 sm:col-span-5' : 'col-span-10',
                )}
              >
                {isDragActive ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm font-medium">
                    <UploadSimpleIcon size={28} className="text-muted-foreground" />
                    {t('dropIt')}
                  </div>
                ) : (
                  <UploadSimpleIcon size={28} className="text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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
                  ? 'bg-gray-50'
                  : 'bg-gray-50 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset]'
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
    images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} place-items-center justify-center gap-4`}>
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square h-40 w-40 overflow-hidden rounded-md">
          <Image
            src={image}
            alt={`Uploaded image ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
};
