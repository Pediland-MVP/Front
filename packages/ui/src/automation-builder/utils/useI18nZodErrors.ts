'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { makeZodI18nMap } from './zodErrorMap';

/**
 * Localizes zod's error messages (Persian) for `AutomationFormSchema`'s validation —
 * shared here (rather than app-local) so both the dashboard's and the admin's
 * `AutomationBuilder` callers set the error map on the SAME `zod` module instance the
 * schema itself was built against (`packages/ui`'s own `zod` v3 dependency). See the
 * comment atop `./zodErrorMap.ts` for why an app-local copy would silently no-op for
 * an app (like admin) that depends on a different major `zod` version for its own,
 * unrelated schemas.
 *
 * Reads the `zod`/`customErrors` (and, if present, `form`) translation namespaces from
 * whichever app renders it — each app must declare those namespaces in its own message
 * catalogue (e.g. `fa.json`) for the messages to resolve.
 */
export const useI18nZodErrors = () => {
  const t = useTranslations('zod');
  const tForm = useTranslations('form');
  const tCustom = useTranslations('customErrors');

  useEffect(() => {
    z.setErrorMap(makeZodI18nMap({ t, tForm, tCustom }));
  }, [t, tForm, tCustom]);
};
