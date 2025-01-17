"use client"

import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import Image from 'next/image'
import { Progress } from "@/components/ui/progress"
import { Upload, X } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

interface PersianImageUploaderProps {
  url: string,
  fieldName: string,
  onUploadComplete?: (url: string) => void,
  defaultImageUrl?: string
}

const ImageUploader: React.FC<PersianImageUploaderProps> = ({ onUploadComplete, url, fieldName, defaultImageUrl }) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(defaultImageUrl || null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultImageUrl || null)
  const { toast } = useToast()

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  })

  useEffect(() => {
    if (file) {
      uploadFile()
    }
  }, [file])

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append(fieldName, file)

    try {
      const response = await axios.post(url, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setProgress(percentCompleted)
        },
        withCredentials: true
      })

      setUploadedUrl(response.data.url)
      if (onUploadComplete) {
        onUploadComplete(response.data.url)
      }
      toast({
        title: "آپلود موفق",
        description: "تصویر شما با موفقیت آپلود شد.",
      })
    } catch (error) {
      console.error('خطا در آپلود فایل:', error)
      toast({
        variant: "destructive",
        title: "خطا در آپلود",
        description: "متأسفانه در آپلود تصویر مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
    setUploadedUrl(null)
    if (onUploadComplete) {
      onUploadComplete('')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
          isDragActive ? 'border-primary' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="پیش‌نمایش"
              width={300}
              height={300}
              className="mx-auto rounded-lg object-cover"
            />
            <button
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-sm text-gray-600">
              {isDragActive
                ? 'فایل را اینجا رها کنید.'
                : 'اینجا کلیک کنید و یا فایل را به اینجا بکشید.'}
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center mt-2">در حال آپلود... {progress}%</p>
        </div>
      )}

      {uploadedUrl && (
        <div className="mt-4 text-center">
          <p className="text-green-600 font-semibold">فایل با موفقیت آپلود شد!</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            مشاهده فایل آپلود شده
          </a>
        </div>
      )}
    </div>
  )
}

export default ImageUploader

