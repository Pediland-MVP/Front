// src/components/app-breadcrumb.tsx
'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export function AppBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const segmentLabel = (seg: string): string => {
    if (isUUID(seg)) return t('detail');
    const map: Record<string, string> = {
      add: t('add'),
      users: t('myCustomers'),
      leads: t('myLeads'),
      subscriptions: t('subscriptions'),
      'referral-codes': t('referralCodes'),
      'discount-codes': t('discountCodes'),
      aiagent: t('aiAgent'),
      'telegram-automation': t('telegramAutomation'),
      docs: t('docs'),
      qa: t('qa'),
      guides: t('guides'),
      chats: t('chats'),
      'test-chat': t('testChat'),
      workspaces: t('workspaces'),
      'workspace-categories': t('workspaceCategories'),
      banners: t('banners'),
      templates: t('templates'),
      labels: t('labels'),
      instagrams: t('instagrams'),
      tasks: t('tasks'),
      admins: t('admins'),
      settings: t('settings'),
      webhooks: t('webhooks'),
      plans: t('plans'),
      jobs: t('jobs'),
      finance: t('finance'),
      'automation-errors': t('automationErrors'),
    };
    return map[seg] ?? decodeURIComponent(seg);
  };

  const segments = useMemo(
    () =>
      pathname
        .split('/')
        .filter(Boolean)
        .map((segment, index, arr) => ({
          segment,
          path: `/${arr.slice(0, index + 1).join('/')}`,
          isLast: index === arr.length - 1,
        })),
    [pathname],
  );

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex w-full overflow-hidden">
        {segments.map(({ segment, path, isLast }) => (
          <React.Fragment key={path}>
            <BreadcrumbItem className={isLast ? 'min-w-0 flex-1' : ''}>
              {isLast ? (
                <span
                  className="md:text-secondary block truncate whitespace-nowrap text-white md:font-medium"
                  aria-current="page"
                >
                  {segmentLabel(segment)}
                </span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={path}>{segmentLabel(segment)}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
