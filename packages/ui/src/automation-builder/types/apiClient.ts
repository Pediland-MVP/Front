export interface AutomationBuilderApiClient {
  /** POSTs a file as multipart/form-data to the caller's upload endpoint and returns the stored file record. */
  upload: (
    file: File,
    onProgress?: (percent: number) => void,
  ) => Promise<{ id: number; url: string; mimeType: string }>;
  /**
   * GETs an arbitrary relative URL and returns an axios-like `{ data }` envelope. Used by
   * the Contents-tree pickers (Instagram post picker, product picker, automation search
   * select) that need read-only list/search endpoints beyond the `upload` contract.
   */
  get: (url: string) => Promise<{ data: any }>;
}
