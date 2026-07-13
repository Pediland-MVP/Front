import { isUUID } from 'class-validator';

import { AutomationForm } from '@/components/Automations/AutomationForm';
import { LayoutPage } from '@/components/Layout/LayoutPage';

type PageProps = {
  searchParams: Promise<{
    copyFrom?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { copyFrom } = await searchParams;
  const copyFromId = copyFrom && isUUID(copyFrom, '4') ? copyFrom : undefined;

  return (
    <LayoutPage col="half">
      <AutomationForm copyFromId={copyFromId} />
    </LayoutPage>
  );
}
