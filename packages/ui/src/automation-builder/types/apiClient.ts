export interface AutomationBuilderApiClient {
  /** POSTs a file as multipart/form-data to the caller's upload endpoint and returns the stored file record. */
  upload: (
    file: File,
    onProgress?: (percent: number) => void,
  ) => Promise<{ id: number; url: string; mimeType: string }>;
}
