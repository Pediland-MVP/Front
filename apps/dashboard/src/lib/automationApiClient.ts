import type { AutomationBuilderApiClient } from '@/automation-builder';
import api from '@/hooks/swr/api-client';

/**
 * The dashboard's implementation of the shared `AutomationBuilderApiClient` contract
 * (Task 17) — reuses the app's own axios instance (auth interceptors, refresh-on-401,
 * etc. already wired in `@/hooks/swr/api-client`) for both the upload and generic-GET
 * needs of `packages/ui`'s automation-builder components.
 *
 * Shared between `AutomationForm.tsx` (the live wrapper around `AutomationBuilder`) and
 * `Form/Reminder.tsx` (which renders the shared `Contents` directly, outside
 * `AutomationBuilder`, for the reminder-content section of an existing automation).
 */
export const dashboardAutomationApiClient: AutomationBuilderApiClient = {
  upload: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/contentCycle/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      })
      .then((res) => res.data.data);
  },
  get: (url: string) => api.get(url),
};
