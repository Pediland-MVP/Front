import type { AutomationBuilderApiClient } from '@/components/automation-builder';
import api from '@/hooks/swr/api-client';

/**
 * The admin app's implementation of the shared `AutomationBuilderApiClient` contract
 * (Task 17) — reuses the admin's own axios instance (auth interceptors, refresh-on-401,
 * etc. already wired in `@/hooks/swr/api-client`) for the automation-builder's
 * upload/generic-GET needs when rendering it in `mode="template"`.
 *
 * Content-step files (IMAGE/VIDEO/AUDIO inside a template's `contents`) are uploaded to
 * the template-specific, id-less `POST /templates/upload-content` endpoint — admin can't
 * call core's `/contentCycle/upload` (separate app/auth), see
 * `Back/knowledge/admin/templates/templates.doc.md`.
 */
export const templateAutomationApiClient: AutomationBuilderApiClient = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/templates/upload-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      })
      .then((res) => res.data.data);
  },
  get: (url: string) => api.get(url),
};
