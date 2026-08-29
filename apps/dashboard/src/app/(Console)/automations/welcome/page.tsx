'use client';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { WelcomeMessageManager } from '@/components/Automations/WelcomeMessageManager';

/**
 * No page-level <h1>: the breadcrumb already names the page and the Card carries
 * the title, so a third heading was only adding vertical space.
 */
export default function Page() {
  return (
    <LayoutCard>
      <WelcomeMessageManager />
    </LayoutCard>
  );
}
