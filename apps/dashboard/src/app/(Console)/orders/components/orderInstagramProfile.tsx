import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChatCircle } from '@phosphor-icons/react';
import Link from 'next/link';
import { OrderNamespace } from '@/types/order/order.namespace';
import { useTranslations } from 'next-intl';

export function OrderInstagramProfile({
  lead,
}: {
  lead: OrderNamespace.GET.Orders['items'][0]['lead'];
}) {
  const t = useTranslations('Orders.OrderDetails');

  return (
    <Card className="mx-auto w-full max-w-xs">
      <CardContent className="flex items-center gap-3 p-3">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={lead.leadInstagram.profilePicture?.url}
            alt={lead.leadInstagram.name ?? `${lead.contact?.firstname} ${lead.contact.lastname}`}
          />
          <AvatarFallback>{lead.firstname?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-grow">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-semibold">
              {lead.leadInstagram.name ?? `${lead.contact?.firstname} ${lead.contact.lastname}`}
            </h3>
          </div>
          <p className="text-muted-foreground truncate text-xs">@{lead.leadInstagram.username}</p>
        </div>
        <Button asChild size="sm" className="flex-shrink-0">
          <Link href={`/directs/${lead.id}`}>
            <ChatCircle className="mr-1 h-4 w-4" />
            {t('chat')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
