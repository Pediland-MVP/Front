import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFileUpload, UploadedFile, FileOrUploadedFile } from '../hooks/useFileUpload';
import { UseFormSetValue, UseFormGetValues, FieldValues, Path } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, File, Image, Video, FileAudio, FilePdf, Play, PlayCircle, Pause } from '@phosphor-icons/react/dist/ssr';

interface FileUploaderProps<TFieldValues extends FieldValues> {
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  fieldName: Path<TFieldValues>;
  uploadUrl: string;
  uploadMethod?: 'POST' | 'PUT';
  fileFieldName?: string;
  defaultFiles?: UploadedFile[];
  accept?: string;
  multiple?: boolean;
}

export const FileUploader = <TFieldValues extends FieldValues>({
  setValue,
  getValues,
  fieldName,
  uploadUrl,
  uploadMethod,
  fileFieldName,
  defaultFiles = [],
  accept,
  multiple = false,
}: FileUploaderProps<TFieldValues>): React.ReactElement => {
  const t = useTranslations('FileUploader');
  const { files, addFiles, removeFile, setDefaultFiles } = useFileUpload<TFieldValues>({
    setValue,
    getValues,
    fieldName,
    uploadUrl,
    uploadMethod,
    fileFieldName,
  });

  React.useEffect(() => {
    if (defaultFiles.length > 0) {
      setDefaultFiles(defaultFiles);
    }
  }, [defaultFiles, setDefaultFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      if (multiple) {
        addFiles(event.target.files);
      }
    }
  };

  const renderFilePreview = (file: FileOrUploadedFile, index: number) => {
    const isUploadedFile = 'url' in file;
    const fileType = isUploadedFile ? file.memeType.split('/')[0] : file.type.split('/')[0];
    const fileUrl = isUploadedFile ? file.url : file.preview;

    let preview: React.ReactNode;
    switch (fileType) {
      case 'image':
        preview = <img src={fileUrl} alt={file.name} className="w-full h-full object-cover" />;
        break;
      case 'video':
        preview = <video src={fileUrl} className="w-full h-full object-cover" />;
        break;
      case 'audio':
        preview = <AudioPreview url={fileUrl} />
        break;
      case 'application/pdf':
        preview = <FilePdf size={48} />;
        break;
      default:
        preview = <File size={48} />;
    }

    return (
      <Card key={index} className="relative w-24 h-24 m-2">
        <CardContent className="p-2 flex items-center justify-center h-full duration-75">
          {preview}
        </CardContent>
        <button
          onClick={() => removeFile(index)}
          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full -mt-2 -mr-2"
        >
          <X size={16} />
        </button>
      </Card>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center items-center">
        {files.map((file, index) => renderFilePreview(file, index))}
      </div>
      <div className="mt-4 flex justify-center">
        <Button asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            {t('selectFiles')}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept={accept}
              multiple={multiple}
            />
          </label>
        </Button>
      </div>
    </div>
  );
};



export const AudioPreview = ({url}: {url: string}) => {

    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause()
        } else {
            audioRef.current?.play()
        }
        setIsPlaying(!isPlaying)
    }

    return (
        <div className="w-full h-full object-cover relative flex flex-col gap-y-2  justify-center items-center">
            <audio src={url} ref={audioRef} />
            <FileAudio size={48} />

            {
                isPlaying ?
                <Pause className='hover:text-gray-300' onClick={handlePlayPause} />
                : 
                <Play className='hover:text-gray-300' onClick={handlePlayPause} />
            }
        </div>
    )

}