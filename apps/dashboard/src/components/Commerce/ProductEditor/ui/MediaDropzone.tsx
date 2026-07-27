'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The design's drop target: a dashed panel with a raised icon tile, which highlights while a file
 * is dragged over it and doubles as a click-to-browse button.
 *
 * Written here rather than reusing `FileUploader` because the design's version is a large,
 * central affordance with its own copy and drag state, and it also has to show upload progress
 * in place. Accepts the same `File[]` callback shape either way.
 */
export const MediaDropzone = ({
  onFiles,
  disabled,
  isUploading,
  progress,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
  progress?: number;
}) => {
  const t = useTranslations('Commerce.Editor.Media');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = (list: FileList | null) => {
    if (!list?.length) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      data-testid="media-dropzone"
      data-dragging={isDragging}
      onDragOver={(e) => {
        // Both are required: without preventDefault the browser navigates to the dropped file.
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        emit(e.dataTransfer.files);
      }}
      className={cn(
        'border-lnv bg-tint rounded-lg border-2 border-dashed px-5 py-6 text-center transition-colors',
        isDragging && 'border-primary bg-tint2',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        data-testid="media-browse"
        className="flex w-full flex-col items-center"
      >
        <span className="border-lnv bg-card text-primary mb-2.5 grid size-10 place-items-center rounded-lg border">
          <UploadIcon className="size-4" />
        </span>
        <span className="mb-1 text-sm font-bold">
          {isUploading ? t('uploading') : t('dropTitle')}
        </span>
        <span className="text-mut text-xs text-pretty">{t('dropHint')}</span>
      </button>

      {isUploading && (
        <div
          role="progressbar"
          aria-valuenow={progress ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-lnv mt-3 h-1.5 w-full overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full transition-[width]"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        data-testid="media-file-input"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          emit(e.target.files);
          // Reset so picking the same file twice in a row still fires a change event.
          e.target.value = '';
        }}
      />
    </div>
  );
};
