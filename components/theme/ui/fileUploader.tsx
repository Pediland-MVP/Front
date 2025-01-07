'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from 'next-intl'
import { v4 as uuidv4 } from 'uuid'
import { File as FileIcon, Image, Video, MusicNote, FileText, X, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { FileUploaderProps, FileWithPreview, UploadedFile } from '@/components/theme/types/fileUploader'

export function FileUploader({ multiple = false, value, onChange, accept }: FileUploaderProps) {
  const t = useTranslations('FileUploader')
  const [files, setFiles] = useState<UploadedFile[]>(value || [])
  const [isDragActive, setIsDragActive] = useState(false)

  useEffect(() => {
    setFiles(value || [])
  }, [value])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.floor(Math.random() * 1000000),

    }))

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }, [files, multiple, onChange])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple,
    noClick: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  })

  const removeFile = (id: number) => {
    const updatedFiles = files.filter((file): file is UploadedFile => 
      'id' in file && file.id !== id
    )
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  const renderPreview = (file: UploadedFile) => {
    // if ('url' in file) {
    //   // Existing file from server
    //   return <img src={file.url} alt="Preview" className="w-full h-full object-cover" />
    // }

    const isUploaded = 'url' in file
    const { file: uploadedFile } = file as FileWithPreview
    const fileType = isUploaded ? file?.mimeType?.split('/')?.[0] : uploadedFile.type.split('/')[0]

    switch (fileType) {
      case 'image':
        return <img src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)} alt="Preview" className="w-full h-full object-cover" />
      case 'video':
        return <video src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)} controls className="w-full h-full object-cover" />
      case 'audio':
        return <MusicNote size={48} weight="thin" />
      case 'application':
        return uploadedFile.type === 'application/pdf' ? (
          <FileText size={48} weight="thin" />
        ) : (
          <FileIcon size={48} weight="thin" />
        )
      default:
        return <FileIcon size={48} weight="thin" />
    }
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className="relative"
      >
        <input {...getInputProps()} />
        <Button 
          type="button"
          onClick={open} 
          className="w-full flex items-center justify-center gap-2"
        >
          <UploadSimple size={20} />
          {t('uploadButton')}
        </Button>
        {isDragActive && (
          <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center">
            <p>{t('dropzone')}</p>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {files.map((file) => (
            <div key={file.id} className="relative w-24 h-24">
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                {renderPreview(file)}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                onClick={() => removeFile(file.id)}
              >
                <X size={12} weight="bold" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

