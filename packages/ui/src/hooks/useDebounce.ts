// packages/ui/src/hooks/useDebounce.ts
// Copied from apps/dashboard/src/hooks/useDebounce.ts — trivial, self-contained. Needed
// by the packages/ui copy of AutomationSearchSelect (see
// automation-builder/Contents/AutomationSearchSelect.tsx).
'use client';
import { useState, useEffect } from 'react';

export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
