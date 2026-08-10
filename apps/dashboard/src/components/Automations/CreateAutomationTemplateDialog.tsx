'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDebounce } from '@/hooks/useDebounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Button } from '@/components/ui/button';
import { TemplatePicker, type TemplateSummary } from '@/automation-builder';

interface CreateAutomationTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// GET /templates?search= returns core's PaginatedResult shape — `{ items, meta }` — not
// `{ data }`. See `Back/apps/core/src/templates/templates.service.ts#readTemplates`.
interface ReadTemplatesResponse {
  items: TemplateSummary[];
}

export function CreateAutomationTemplateDialog({
  open,
  onOpenChange,
}: CreateAutomationTemplateDialogProps) {
  const t = useTranslations('Automations.TemplatePicker');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useSWR<ReadTemplatesResponse>(
    open ? `/templates?search=${encodeURIComponent(debouncedSearch)}` : null,
    fetcher,
  );

  return (
    <TemplatePicker
      open={open}
      onOpenChange={onOpenChange}
      templates={data?.items ?? []}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      onSelect={(template) => router.push(`/automations/add?templateId=${template.id}`)}
      searchPlaceholder={t('searchPlaceholder')}
      emptyLabel={t('empty')}
      footerSlot={
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" type="button" onClick={() => router.push('/automations/add')}>
            {t('startFromScratch')}
          </Button>
        </div>
      }
    />
  );
}
