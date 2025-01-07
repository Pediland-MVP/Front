import { UUID } from 'crypto'

export type FileWithPreview = {
  file: File
  id: number
}

export type ExistingFile = {
  id: number
  url: string
  mimeType: string
}

export type UploadedFile = FileWithPreview | ExistingFile

export interface FileUploaderProps {
  multiple?: boolean
  value: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  accept?: string
}

