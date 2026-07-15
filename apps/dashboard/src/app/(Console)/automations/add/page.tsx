import { isUUID } from 'class-validator';

import { AutomationForm } from '@/components/Automations/AutomationForm';
import { LayoutPage } from '@/components/Layout/LayoutPage';

type PageProps = {
  searchParams: Promise<{
    copyFrom?: string;
    templateId?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { copyFrom, templateId } = await searchParams;
  const copyFromId = copyFrom && isUUID(copyFrom, '4') ? copyFrom : undefined;
  const validTemplateId = templateId && isUUID(templateId, '4') ? templateId : undefined;

  return (
    <LayoutPage col="half">
      <AutomationForm copyFromId={copyFromId} templateId={validTemplateId} />
    </LayoutPage>
  );
}
