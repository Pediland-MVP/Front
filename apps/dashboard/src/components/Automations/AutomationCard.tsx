'use client';

import { Automation } from '@/schemas/automation';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CrosshairIcon } from '@phosphor-icons/react/dist/ssr/Crosshair';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { CircleXIcon, CopyIcon, MessageSquareMoreIcon, PencilIcon } from 'lucide-react';
import { CardImage } from '../Global/CardImage';
import { usePermissions } from '@/hooks/usePermissions';
import { useBusinessInfoGate } from '@/hooks/useBusinessInfoGate';
import { fetcher } from '@/hooks/swr/api-client';
import { IResponseMessage } from '@/types/responseMessage';
import { InstagramNamespace } from '@/types/instagram';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

interface AutomationCardProps {
  item: Automation;
  handleDelete: (id: string) => void;
}

const AutomationCardComponent = ({ item, handleDelete }: AutomationCardProps) => {
  const router = useRouter();
  const { startAutomationCreate } = useBusinessInfoGate();
  const t = useTranslations('Automations.Card');
  const specifiedPost = item.instagramPost?.picture?.url;
  const { can } = usePermissions();

  // Same SWR key InstagramSelectField/AutomationForm use — dedupes, no extra request.
  const { data: accountsResponse } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });
  const hasMultipleInstagramAccounts = (accountsResponse?.data?.length ?? 0) > 1;

  const usernames = item.instagramLinks?.map((l) => l.instagram?.username).filter(Boolean) ?? [];

  return (
    <Card
      className={cn(
        'h-full gap-0 border-violet-200 p-0 shadow-violet-200',
        !item.enabled && 'opacity-60',
      )}
    >
      {/* flex-1 makes the content area absorb the extra height of the grid row, so the
          footer always sits on the card's bottom edge no matter how tall the content is. */}
      <CardContent className="flex-1 p-2">
        <div className="flex h-full">
          <div className="min-w-0 flex-1 space-y-3 p-2 text-sm">
            {(item.title || !item.enabled) && (
              <div className="flex items-center gap-2">
                {item.title && <div className="text-sm font-semibold">{item.title}</div>}
                {!item.enabled && (
                  <Badge
                    variant="outline"
                    className="h-5 rounded-full border-gray-300 bg-gray-100 px-2 py-0 text-[11px] font-medium text-gray-500"
                  >
                    {t('disabled_badge')}
                  </Badge>
                )}
              </div>
            )}
            {hasMultipleInstagramAccounts && (
              <div className="flex min-w-0 items-center gap-1 text-[12px] text-gray-400">
                <InstagramLogoIcon size={13} className="shrink-0" />
                {/* truncate keeps this to a single line, so a long account list can't
                    make the card taller than its neighbours. */}
                <span className="truncate">
                  {usernames.length > 0
                    ? usernames.map((u) => `@${u}`).join(', ')
                    : t('no_instagram_assigned')}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <div className="text-secondary flex items-center gap-1 font-medium">
                <CrosshairIcon size={18} weight="duotone" />
                {t('conditions')}
              </div>
              {/* min-h-6 = one badge row, so an automation with no conditions keeps the
                  same height as one with badges. */}
              <div className="line-clamp-1 min-h-6 space-x-1.5">
                {item.conditions.map((condition) => (
                  <Badge
                    variant="outline"
                    className="h-6 rounded-full border-indigo-200/60 bg-indigo-50 px-2 py-0 text-[13px] font-medium text-indigo-600"
                    key={condition.id}
                  >
                    {condition.value}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-secondary flex items-center gap-2 font-medium">
              <div className="flex items-center gap-1.5 text-[13px]">
                <div className="md:hidden">{t('active_in')}</div>
                <div className="flex items-center gap-2">
                  <div className="border-l border-gray-200 pl-2">
                    {item.isDirect ? (
                      <div className="text-primary">{t('direct')}</div>
                    ) : (
                      <div className="font-light text-gray-300">{t('direct')}</div>
                    )}
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    {item.isComment ? (
                      <div className="text-primary">{t('comment')}</div>
                    ) : (
                      <div className="font-light text-gray-300">{t('comment')}</div>
                    )}
                  </div>
                  <div>
                    {item.instagramPost ? (
                      <div className="text-primary">{t('specified_post')}</div>
                    ) : (
                      <div className="font-light text-gray-300">{t('specified_post')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {item.instagramPost && (
            <div className="relative w-20 shrink-0">
              <CardImage src={item.instagramPost?.picture?.url} />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className="text-muted-foreground hover:text-secondary h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-blue-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => router.push(`/automations/sessions?contentCycleId=${item.id}`)}
        >
          <MessageSquareMoreIcon className="text-secondary" />
          {t('answers')} ({item.sessionsCount?.toLocaleString() || 0})
        </Button>

        {can('automation:edit') && (
          <Button
            className="text-muted-foreground h-9 w-full flex-1 rounded-none hover:bg-green-100 hover:text-green-800"
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => router.push(`/automations/${item.id}`)}
          >
            <PencilIcon className="text-green-600" />
            {t('edit')}
          </Button>
        )}

        {can('automation:create') && (
          <Button
            className="text-muted-foreground h-9 w-full flex-1 rounded-none hover:bg-blue-100 hover:text-blue-800"
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => startAutomationCreate(`/automations/add?copyFrom=${item.id}`)}
          >
            <CopyIcon className="text-blue-600" />
            {t('copy')}
          </Button>
        )}

        {can('automation:delete') && (
          <Button
            className="hover:text-destructive text-muted-foreground h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <CircleXIcon className="text-destructive" />
            {t('delete')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export const AutomationCard = memo(AutomationCardComponent);
