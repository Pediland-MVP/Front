'use client';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { ImportWizard } from '@/components/Commerce/Import/ImportWizard';

export default function Page() {
  return (
    <LayoutPage>
      <ImportWizard />
    </LayoutPage>
  );
}
